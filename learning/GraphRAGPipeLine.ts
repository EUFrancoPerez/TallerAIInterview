import { GoogleGenerativeAI } from "@google/generative-ai";
import neo4j, { Driver } from "neo4j-driver";
import Database from "better-sqlite3";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function graphragQuery(
  userQuery: string,
  db: Database.Database,  // SQLite for vector search
  neo4jDriver: Driver,    // Neo4j for graph queries
  topK = 5
): Promise<string> {
  // Step 1: Extract entities from the query
  const entityResponse = await model.generateContent(
    `Extract the key entities (names, services, concepts) from this query. Return a JSON array of strings.\n\nQuery: ${userQuery}`
  );

  const entityText = entityResponse.response.text();
  const entities = JSON.parse(entityText) as string[];

  // Step 2: Vector search for semantic context
  const vectorResults = await memorySearch(db, userQuery, topK);
  const semanticContext = vectorResults
    .map((r) => `- ${r.text}`)
    .join("\n");

  // Step 3: Graph traversal for structural context
  const graphParts: string[] = [];
  const session = neo4jDriver.session();

  try {
    for (const entity of entities) {
      const result = await session.run(
        `MATCH (n {name: $name})-[r]-(connected)
         RETURN n.name AS source,
                type(r) AS relationship,
                connected.name AS target,
                labels(connected)[0] AS targetType
         LIMIT 20`,
        { name: entity }
      );

      for (const record of result.records) {
        graphParts.push(
          `${record.get("source")} --[${record.get("relationship")}]--> ` +
            `${record.get("target")} (${record.get("targetType")})`
        );
      }
    }
  } finally {
    await session.close();
  }

  const graphContext =
    graphParts.length > 0
      ? graphParts.join("\n")
      : "No graph relationships found.";

  // Step 4: Generate answer with combined context
  const response = await model.generateContent(
    `Answer the following question using the provided context.

Question: ${userQuery}

Semantic context (from document search):
${semanticContext}

Structural context (from knowledge graph):
${graphContext}

Provide a comprehensive answer that leverages both the semantic and structural information.`
  );

  return response.response.text();
}


async function naturalLanguageToCypher(question: string): Promise<string> {
  const schemaDescription = `
    Node types and properties:
    - Person: name, role, team
    - Service: name, language, status
    - Technology: name, category
    - Organization: name, type

    Relationship types:
    - MANAGES (Person -> Person)
    - MAINTAINS (Person -> Service)
    - DEPENDS_ON (Service -> Service)
    - USES (Service -> Technology)
    - WORKS_AT (Person -> Organization)
  `;

  const response = await model.generateContent(
    `Given this Neo4j graph schema:\n${schemaDescription}\n\nGenerate a Cypher query to answer: ${question}\n\nReturn ONLY the Cypher query, no explanation.`
  );

  return response.response.text().trim();
}