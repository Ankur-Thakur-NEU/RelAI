// mockFinalizeTransactionTool.ts
import { Tool } from "@langchain/core/tools";
import { executeX402Payment } from "../../utils/x402Client";

export class MockFinalizeTransactionTool extends Tool {
  name = "finalizeTransaction";
  description =
    "Mock Hedera contract call. It will first execute an x402 payment, then return a dummy Hedera tx. Respond with the x402Ref and hederaTxId included in your answer.";

  async _call(input: string | undefined) {
    console.log("Mock finalize called with:", input);

    try {
      const { x402Ref } = await executeX402Payment(
        process.env.X402_API_URL as string
      );
      console.log(`REAL x402Ref from tool: ${x402Ref}`);
      return `✅ x402 Payment Ref: ${x402Ref} | Hedera TxId: 0xdeadbeef | Input: ${input}`;
    } catch (err) {
      console.error("executeX402Payment failed inside MockFinalize:", err);
      throw err;
    }
  }
}
