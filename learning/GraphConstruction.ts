import neo4j, { Driver, Session } from "neo4j-driver";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Neo4j Connection ---
const driver: Driver = neo4j.driver(
  "neo4j+s://xxxxx.databases.neo4j.io",
  neo4j.auth.basic("neo4j", "your-password")
);

// --- Types ---
interface Entity {
  name: string;
  type: string;
  properties: Record<string, unknown>;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

interface ExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
}

// --- Entity Extraction with Gemini ---
async function extractEntitiesAndRelations(
  text: string
): Promise<ExtractionResult> {
  const response = await model.generateContent(
    `Extract entities and relationships from the following text.
Return a JSON object with:
- "entities": array of {"name": string, "type": string, "properties": object}
- "relationships": array of {"source": string, "target": string, "type": string, "properties": object}

Entity types: Person, Organization, Service, Technology, Concept
Relationship types: WORKS_AT, MANAGES, MAINTAINS, DEPENDS_ON, USES, RELATES_TO

Text:
${text}

Return ONLY valid JSON, no markdown formatting.`
  );

  const content = response.response.text();
  return JSON.parse(content) as ExtractionResult;
}

// --- Graph Construction ---
async function createEntity(
  session: Session,
  entity: Entity
): Promise<void> {
  const query = `MERGE (n:${entity.type} {name: $name}) SET n += $props`;
  await session.run(query, {
    name: entity.name,
    props: { ...entity.properties, name: entity.name },
  });
}

async function createRelationship(
  session: Session,
  rel: Relationship
): Promise<void> {
  const query = `
    MATCH (a {name: $source}), (b {name: $target})
    MERGE (a)-[r:${rel.type}]->(b)
    SET r += $props
  `;
  await session.run(query, {
    source: rel.source,
    target: rel.target,
    props: rel.properties,
  });
}

async function buildKnowledgeGraph(
  text: string
): Promise<ExtractionResult> {
  const extracted = await extractEntitiesAndRelations(text);
  const session = driver.session();

  try {
    for (const entity of extracted.entities) {
      await createEntity(session, entity);
    }
    for (const rel of extracted.relationships) {
      await createRelationship(session, rel);
    }
  } finally {
    await session.close();
  }

  return extracted;
}

// --- Querying ---
async function queryGraph(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<Record<string, unknown>[]> {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
}

// --- Example Usage ---
async function main() {
  const text = `
    The authentication service is maintained by Alice Chen from the Platform team.
    It depends on the user-database service and the Redis cache.
    Bob Martinez manages Alice and oversees all platform infrastructure.
    The auth service is written in Python and uses FastAPI and JWT tokens.
  `;

  const extracted = await buildKnowledgeGraph(text);
  console.log(
    `Created ${extracted.entities.length} entities and ${extracted.relationships.length} relationships`
  );

  const deps = await queryGraph(`
    MATCH (s:Service {name: "authentication service"})-[:DEPENDS_ON]->(dep)
    RETURN dep.name AS dependency, labels(dep)[0] AS type
  `);

  for (const r of deps) {
    console.log(`  Depends on: ${r.dependency} (${r.type})`);
  }

  await driver.close();
}

main();