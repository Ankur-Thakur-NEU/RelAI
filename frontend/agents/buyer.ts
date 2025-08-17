import "server-only";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { Client, PrivateKey } from "@hashgraph/sdk";
import {
  HederaLangchainToolkit,
  coreQueriesPlugin,
  AgentMode,
} from "hedera-agent-kit";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MockSubgraphTool } from "./tools/mockGraphTool";
import { FinalizeTransactionTool } from "./tools/finalizeTrxTool";

export interface CreateBuyerAgentOptions {
  hederaAccountId: string;
  hederaPrivateKey: string;
  llm: BaseChatModel;
}

function createHederaClient(accountId: string, privateKey: string): Client {
  const client = Client.forTestnet();
  client.setOperator(accountId, PrivateKey.fromStringECDSA(privateKey));
  return client;
}

export function createBuyerAgent({
  hederaAccountId,
  hederaPrivateKey,
  llm,
}: CreateBuyerAgentOptions): AgentExecutor {
  const hederaClient = createHederaClient(hederaAccountId, hederaPrivateKey);

  const hederaToolkit = new HederaLangchainToolkit({
    client: hederaClient,
    configuration: {
      plugins: [coreQueriesPlugin],
      // Execution context...look into this
      context: {
        mode: AgentMode.AUTONOMOUS,
        accountId: hederaAccountId,
      },
    },
  });

  const finalizeTransactionTool = new FinalizeTransactionTool(
    hederaClient,
    process.env.REPUTATION_MANAGER_CONTRACT_ADDRESS! // Make sure this env var is set
  );

  const mockGraphTool = new MockSubgraphTool();
  //   const mockFinalizeTransactionTool = new MockFinalizeTransactionTool();
  const tools = [
    ...hederaToolkit.getTools(),
    finalizeTransactionTool,
    // mockFinalizeTransactionTool,
    mockGraphTool,
  ];

  const SYSTEM_PROMPT = `
	You are a Buyer Agent operating on Hedera testnet.

	Workflow:
	1. First, call subgraphNaturalLanguageQuery to pick the highest-reputation agent.
	2. Then, call finalizeTransaction on that agent.

	IMPORTANT:
	After finalizeTransaction runs, your final answer MUST return ONLY the two URLs provided by the tool:
	- hederaExplorerUrl
	- x402ExplorerUrl

	Do not add any extra commentary.
	`.trim();

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{input}"],
    ["ai", "{agent_scratchpad}"],
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    // Optionally: maxIterations: 8,
  });

  return executor;
}
