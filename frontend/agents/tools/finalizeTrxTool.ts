import { Tool } from "@langchain/core/tools";
import {
  ContractExecuteTransaction,
  Client,
  ContractId,
  ContractFunctionParameters,
} from "@hashgraph/sdk";
import { JsonFragment } from "ethers";
import { executeX402Payment } from "../../utils/x402Client";

export class FinalizeTransactionTool extends Tool {
  name = "finalizeTransaction";
  description =
    "Calls finalizeTransaction on the ReputationManager contract. It will first execute an x402 payment, then return hederaExplorerUrl and x402ExplorerUrl so you can verify the transaction.";

  private client: Client;
  private contractId: string;

  constructor(client: Client, contractId: string) {
    super();
    this.client = client;
    this.contractId = contractId;
  }

  async _call() {
    const { x402Ref } = await executeX402Payment(
      process.env.X402_API_URL as string
    );

    try {
      const contractId = ContractId.fromSolidityAddress(this.contractId);

      const tx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(200_000)
        .setFunction(
          "finalizeTransaction",
          new ContractFunctionParameters()
            .addAddress(process.env.SELLER_WALLET_EVM!)
            .addInt8(2)
            .addString(x402Ref)
        );

      const submitTx = await tx.execute(this.client);
      const receipt = await submitTx.getReceipt(this.client);

      const hederaExplorerUrl = `https://explorer.arkhia.io/testnet/contract/${this.contractId}`;
      const x402ExplorerUrl = `https://sepolia.basescan.org/tx/${x402Ref}`;

      return {
        hederaExplorerUrl,
        x402ExplorerUrl,
        status: receipt.status.toString(),
      };
    } catch (err) {
      console.error("❌ Hedera tx failed:", err);
      throw err;
    }
  }
}
