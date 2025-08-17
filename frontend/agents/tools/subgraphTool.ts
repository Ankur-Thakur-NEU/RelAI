// frontend/agents/tools/mcpSubgraphTool.ts
import { Tool } from "@langchain/core/tools";

export class MCPSubgraphTool extends Tool {
  name = "subgraphNaturalLanguageQuery";
  description =
    "Query the MCP subgraph to retrieve reputation info or any required data *before* taking on-chain action with finalizeTransaction.";

  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    super();
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async _call(question: string | undefined) {
    if (!question) throw new Error("A natural-language question is required.");

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query: question }),
    });

    if (!res.ok) throw new Error(`MCP subgraph error: ${await res.text()}`);

    const json = await res.json();

    // "agents" should be your top-level return field
    const agents = json?.data?.agents?.map((a: any) => ({
      id: a.id,
      reputationScore: a.currentRep,
      tag: a.tag,
    }));

    if (!agents || agents.length === 0) {
      return "No matching agents found.";
    }

    // This structure is much easier for the LLM to reason over
    return agents;
  }
}
