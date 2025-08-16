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
import { ToolInterface } from "@langchain/core/tools";

export interface CreateBuyerAgentOptions {
  hederaAccountId: string;
  hederaPrivateKey: string;
  llm: BaseChatModel;
  /**
   * Any extra tools you want to include alongside Hedera toolkit tools,
   * e.g. your subgraph tool or contract invoke tool.
   */
  extraTools?: ToolInterface[];
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
  extraTools = [],
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

  const tools = [...hederaToolkit.getTools(), ...extraTools];

  const SYSTEM_PROMPT = `
	You are a Buyer Agent operating on Hedera testnet.
	- You can query Hedera state and submit transactions via toolkit tools.
	- You may also call custom tools (e.g., subgraph, hireAndExecute).
	- Be concise and return concrete results. If you perform chain actions, summarize tx IDs.
  `.trim();
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{input}"],
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
