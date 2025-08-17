import { Tool } from "@langchain/core/tools";
import { ContractExecuteTransaction, Client, ContractId } from "@hashgraph/sdk";
import { Interface, JsonFragment } from "ethers";
import { executeX402Payment } from "../../utils/x402Client";

export class FinalizeTransactionTool extends Tool {
  name = "finalizeTransaction";
  description =
    "Calls finalizeTransaction on the ReputationManager contract *after* automatically executing an x402 payment to the seller.";

  private client: Client;
  private contractId: string;
  private abi: JsonFragment[];

  constructor(client: Client, contractId: string, abi: JsonFragment[]) {
    super();
    this.client = client;
    this.contractId = contractId;
    this.abi = abi;
  }

  async _call(rawInput: string | undefined) {
    if (!rawInput) {
      throw new Error(
        "Input string is required, expected JSON with seller and rating"
      );
    }

    let inputs: { seller: string; rating: number };
    try {
      inputs = JSON.parse(rawInput);
    } catch {
      throw new Error(
        "Invalid JSON input. Expected JSON string with keys seller and rating"
      );
    }

    // 1) Execute x402 payment before Hedera call
    const { x402Ref } = await executeX402Payment(
      process.env.X402_API_URL as string
    );
    console.log("x402Ref:", x402Ref);

    // 2) Encode Hedera contract call
    const iface = new Interface(this.abi);
    const data = iface.encodeFunctionData("finalizeTransaction", [
      inputs.seller,
      inputs.rating,
      x402Ref,
    ]);

    const tx = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(this.contractId))
      .setGas(200_000)
      .setFunctionParameters(Buffer.from(data.slice(2), "hex"));

    const submitTx = await tx.execute(this.client);
    const receipt = await submitTx.getReceipt(this.client);

    return {
      x402Ref,
      transactionId: submitTx.transactionId.toString(),
      status: receipt.status.toString(),
    };
  }
}
