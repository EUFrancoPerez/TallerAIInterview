import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession,
  FunctionDeclarationsTool,
  FunctionCall,
  Part,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

type ToolHandler = (args: Record<string, any>) => any;

export class Agent {
  private systemPrompt: string;
  private tools: FunctionDeclarationsTool[];
  private toolHandlers: Record<string, ToolHandler>;
  private maxIterations: number;
  private model: GenerativeModel;

  constructor(
    systemPrompt: string,
    tools: FunctionDeclarationsTool[],
    toolHandlers: Record<string, ToolHandler>,
    maxIterations = 20,
  ) {
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.toolHandlers = toolHandlers;
    this.maxIterations = maxIterations;
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: this.systemPrompt,
      tools: this.tools,
    });
  }

  async run(task: string): Promise<string> {
    const chat: ChatSession = this.model.startChat();
    let response = (await chat.sendMessage(task)).response;

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      console.log(`\n--- Iteration ${iteration + 1} ---`);

      const functionCalls: FunctionCall[] = (response.candidates?.[0]?.content.parts ?? [])
        .filter((part) => part.functionCall?.name)
        .map((part) => part.functionCall!);

      if (functionCalls.length === 0) {
        // Model is done -- return text response
        return response.text();
      }

      const functionResponses = this.handleToolCalls(functionCalls);
      response = (await chat.sendMessage(functionResponses)).response;
    }

    return "Agent reached maximum iterations without completing the task.";
  }

  private handleToolCalls(functionCalls: FunctionCall[]): Part[] {
    const responses: Part[] = [];

    for (const fc of functionCalls) {
      const name = fc.name;
      const args = fc.args ?? {};
      const handler = this.toolHandlers[name];
      let result: any;

      if (handler) {
        try {
          result = handler(args);
          console.log(`  [Tool] ${name} -> success`);
        } catch (e: any) {
          result = `Error: ${e.message ?? String(e)}`;
          console.log(`  [Tool] ${name} -> error: ${e.message ?? e}`);
        }
      } else {
        result = `Error: Unknown tool '${name}'`;
      }

      const resultData =
        typeof result === "string" && result.startsWith("{")
          ? JSON.parse(result)
          : { result };

      responses.push({
        functionResponse: {
          name,
          response: resultData,
        },
      });
    }

    return responses;
  }
}
