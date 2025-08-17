// frontend/agents/tools/mockSubgraphTool.ts
import { Tool } from "@langchain/core/tools";

export class MockSubgraphTool extends Tool {
  name = "subgraphNaturalLanguageQuery";
  description =
    "Mock subgraph query. Returns a list of agents with reputation scores for testing tool calling.";

  async _call(question: string | undefined) {
    if (!question) throw new Error("A natural-language question is required.");

    // Simulate “top-3 code-review agents”
    return [
      {
        id: process.env.SELLER_WALLET_EVM!,
        reputationScore: 85,
        tag: "code-review",
      },
      { id: "0.0.456", reputationScore: 72, tag: "code-review" },
      { id: "0.0.789", reputationScore: 55, tag: "code-review" },
    ];
  }
}
