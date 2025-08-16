import "server-only";

import { ChatOpenAI } from "@langchain/openai";
import { createBuyerAgent } from "./buyer";
import type { AgentExecutor } from "langchain/agents";

let buyer: AgentExecutor | null = null;

export async function getBuyerAgent() {
  if (buyer) return buyer;
  buyer = createBuyerAgent({
    hederaAccountId: process.env.HEDERA_ACCOUNT_ID!,
    hederaPrivateKey: process.env.HEDERA_PRIVATE_KEY!,
    llm: new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4o-mini",
      temperature: 0.2,
    }),
  });
  return buyer;
}
