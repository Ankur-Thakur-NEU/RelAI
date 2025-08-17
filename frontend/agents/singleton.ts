import "server-only";

import { ChatAnthropic } from "@langchain/anthropic";

import { createBuyerAgent } from "./buyer";
import type { AgentExecutor } from "langchain/agents";

let buyer: AgentExecutor | null = null;

export async function getBuyerAgent() {
  if (buyer) return buyer;
  buyer = createBuyerAgent({
    hederaAccountId: process.env.HEDERA_ACCOUNT_ID!,
    hederaPrivateKey: process.env.HEDERA_PRIVATE_KEY!,
    llm: new ChatAnthropic({
      model: "claude-3-5-sonnet-20241022",
    }),
  });
  return buyer;
}
