import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent } from "langchain/agents";
import { Client, PrivateKey } from "@hashgraph/sdk";
import {
  HederaLangchainToolkit,
  coreQueriesPlugin,
  AgentMode,
} from "hedera-agent-kit";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ToolInterface } from "@langchain/core/tools";

export interface CreateBuyerAgentOptions {
  name: string;
  hederaAccountId: string;
  hederaPrivateKey: string;
  llm: BaseChatModel;
  /**
   * Any extra tools you want to include alongside Hedera toolkit tools,
   * e.g. your subgraph tool or contract invoke tool.
   */
  extraTools: ToolInterface[];
}

function createHederaClient(accountId: string, privateKey: string): Client {
  const client = Client.forTestnet();
  client.setOperator(accountId, PrivateKey.fromStringECDSA(privateKey));
  return client;
}

export async function createBuyerAgent({
  name,
  hederaAccountId,
  hederaPrivateKey,
  llm,
  extraTools = [],
}: CreateBuyerAgentOptions) {
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

  const prompt = ChatPromptTemplate.fromMessages(["system", ""]);

  const agent = createToolCallingAgent({
    llm, // your LLM instance
    tools,
    prompt, // your prompt setup
  });

  // Attach metadata (optional)
  const agentWithMetaData = agent.withConfig({
    metadata: { name, hederaAccountId },
  });

  return agentWithMetaData;
}
