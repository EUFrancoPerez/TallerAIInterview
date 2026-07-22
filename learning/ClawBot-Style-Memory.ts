import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// --- Configuration ---
const MEMORY_DIR = "./memory";
const DB_PATH = "./memory.db";
const EMBEDDING_DIM = 384;  // all-minilm produces 384-dimensional embeddings
const OLLAMA_BASE_URL = "http://localhost:11434";
const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 80;
const HYBRID_VECTOR_WEIGHT = 0.7;
const HYBRID_TEXT_WEIGHT = 0.3;

// --- Types ---
interface Chunk {
  id: number;
  filePath: string;
  chunkIndex: number;
  text: string;
  metadata: Record<string, unknown>;
  contentHash: string;
}

interface SearchResult {
  text: string;
  filePath: string;
  metadata: Record<string, unknown>;
  score: number;
}

// --- Embedding Generation (using Ollama - free, runs locally) ---
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  // Using Ollama with all-minilm model (free, local)
  // Install: ollama pull all-minilm
  const embeddings: number[][] = [];
  for (const text of texts) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "all-minilm",
        prompt: text,
      }),
    });

    const data = (await response.json()) as { embedding: number[] };
    embeddings.push(data.embedding);
  }
  return embeddings;
}

async function getQueryEmbedding(query: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "all-minilm",
      prompt: query,
    }),
  });

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

// --- Chunking ---
function chunkText(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = start + chunkSize;
    chunks.push(words.slice(start, end).join(" "));
    start += chunkSize - overlap;
  }

  return chunks;
}

// --- Database Setup ---
function initDb(dbPath = DB_PATH): Database.Database {
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      metadata TEXT,
      content_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      text,
      content='chunks',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
      INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, text)
        VALUES('delete', old.id, old.text);
    END;
  `);

  return db;
}

// --- Indexing ---
async function indexFile(
  db: Database.Database,
  filePath: string
): Promise<number> {
  const text = fs.readFileSync(filePath, "utf-8");
  const contentHash = crypto.createHash("sha256").update(text).digest("hex");

  // Check if already indexed with same content
  const existing = db
    .prepare("SELECT content_hash FROM chunks WHERE file_path = ? LIMIT 1")
    .get(filePath) as { content_hash: string } | undefined;

  if (existing?.content_hash === contentHash) {
    return 0; // No changes
  }

  // Remove old chunks
  db.prepare("DELETE FROM chunks WHERE file_path = ?").run(filePath);

  // Chunk and embed
  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  const embeddings = await getEmbeddings(chunks);

  const insertChunk = db.prepare(`
    INSERT INTO chunks (file_path, chunk_index, text, metadata, content_hash)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (let i = 0; i < chunks.length; i++) {
      const metadata = JSON.stringify({
        file_path: filePath,
        chunk_index: i,
        total_chunks: chunks.length,
      });
      insertChunk.run(filePath, i, chunks[i], metadata, contentHash);
    }
  });

  insertMany();
  return chunks.length;
}

// --- Hybrid Search ---
async function memorySearch(
  db: Database.Database,
  query: string,
  topK = 5,
  vectorWeight = HYBRID_VECTOR_WEIGHT,
  textWeight = HYBRID_TEXT_WEIGHT
): Promise<SearchResult[]> {
  // Full-text search
  const textResults = new Map<number, number>();
  try {
    const ftsRows = db
      .prepare(
        `SELECT rowid, rank FROM chunks_fts
         WHERE chunks_fts MATCH ?
         ORDER BY rank LIMIT ?`
      )
      .all(query, topK * 3) as Array<{ rowid: number; rank: number }>;

    if (ftsRows.length > 0) {
      const maxRank = Math.max(...ftsRows.map((r) => Math.abs(r.rank))) || 1;
      for (const row of ftsRows) {
        textResults.set(row.rowid, Math.abs(row.rank) / maxRank);
      }
    }
  } catch {
    // FTS query may fail on certain query strings; fall back to vector only
  }

  // Vector search (in-memory cosine similarity if sqlite-vec is unavailable)
  const vectorResults = new Map<number, number>();
  try {
    const queryEmbedding = await getQueryEmbedding(query);
    // Note: For production with sqlite-vec, use the vec0 virtual table query.
    // This fallback computes cosine similarity in JS.
    const allChunks = db
      .prepare("SELECT id, text FROM chunks")
      .all() as Array<{ id: number; text: string }>;

    const chunkTexts = allChunks.map((c) => c.text);
    const chunkEmbeddings = await getEmbeddings(chunkTexts);

    const scored: Array<{ id: number; score: number }> = [];
    for (let i = 0; i < allChunks.length; i++) {
      const score = cosineSimilarity(queryEmbedding, chunkEmbeddings[i]);
      scored.push({ id: allChunks[i].id, score });
    }
    scored.sort((a, b) => b.score - a.score);

    const maxScore = scored[0]?.score || 1;
    for (const item of scored.slice(0, topK * 3)) {
      vectorResults.set(item.id, item.score / maxScore);
    }
  } catch {
    // Vector search failed; rely on text results only
  }

  // Combine scores
  const allIds = new Set([...vectorResults.keys(), ...textResults.keys()]);
  const combined: Array<{ id: number; score: number }> = [];

  for (const id of allIds) {
    const vScore = vectorResults.get(id) ?? 0;
    const tScore = textResults.get(id) ?? 0;
    combined.push({ id, score: vectorWeight * vScore + textWeight * tScore });
  }

  combined.sort((a, b) => b.score - a.score);
  const topIds = combined.slice(0, topK);

  // Fetch details
  const getChunk = db.prepare(
    "SELECT text, file_path, metadata FROM chunks WHERE id = ?"
  );

  return topIds.map(({ id, score }) => {
    const row = getChunk.get(id) as {
      text: string;
      file_path: string;
      metadata: string;
    };
    return {
      text: row.text,
      filePath: row.file_path,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      score,
    };
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Memory File Management ---
function writeDailyLog(entry: string, memoryDir = MEMORY_DIR): void {
  fs.mkdirSync(memoryDir, { recursive: true });
  const today = new Date().toISOString().split("T")[0];
  const logPath = path.join(memoryDir, `${today}.md`);
  const timestamp = new Date().toTimeString().split(" ")[0];

  fs.appendFileSync(logPath, `\n## ${timestamp}\n\n${entry}\n`, "utf-8");
}

function updateLongTermMemory(
  fact: string,
  memoryDir = MEMORY_DIR
): void {
  fs.mkdirSync(memoryDir, { recursive: true });
  const memoryPath = path.join(memoryDir, "MEMORY.md");

  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, "# Long-Term Memory\n\n", "utf-8");
  }
  fs.appendFileSync(memoryPath, `- ${fact}\n`, "utf-8");
}

function memoryGet(filePath: string, memoryDir = MEMORY_DIR): string {
  const fullPath = path.join(memoryDir, filePath);
  if (!fs.existsSync(fullPath)) {
    return `File not found: ${filePath}`;
  }
  return fs.readFileSync(fullPath, "utf-8");
}