type EmbeddingFn = (text: string) => number[];

interface Entry {
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export class VectorMemory {
  private entries: Entry[] = [];
  private embed: EmbeddingFn;

  constructor(embeddingFn: EmbeddingFn) {
    this.embed = embeddingFn;
  }

  store(text: string, metadata: Record<string, any> = {}): void {
    const embedding = this.embed(text);
    this.entries.push({ text, embedding, metadata });
  }

  search(query: string, topK = 5): Entry[] {
    const queryEmb = this.embed(query);
    const scored = this.entries.map((entry) => ({
      score: cosineSimilarity(queryEmb, entry.embedding),
      entry,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(({ entry }) => entry);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}
