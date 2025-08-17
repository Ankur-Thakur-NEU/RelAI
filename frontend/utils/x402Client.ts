import { withPaymentInterceptor, decodeXPaymentResponse } from "x402-axios";
import axios from "axios";
import { CdpClient } from "@coinbase/cdp-sdk";
import { toAccount } from "viem/accounts";

export async function executeX402Payment(baseURL: string) {
  // 1) Initialize CDP client (uses env keys)
  const cdp = new CdpClient();

  // 2) List *existing* accounts in your wallet
  const { accounts } = await cdp.evm.listAccounts();

  // 3) Find the account matching the funded EVM address you want
  const desiredEvmAddress = (
    process.env.CDP_BUYER_WALLET_EVM as string
  ).toLowerCase();
  const existing = accounts.find(
    (a) => a.address.toLowerCase() === desiredEvmAddress
  );

  if (!existing) {
    throw new Error(`No CDP account found for address ${desiredEvmAddress}`);
  }

  console.log(`Using pre-funded CDP EVM account: ${existing.address}`);

  // 4) Convert to viem-style account
  const viemAccount = toAccount(existing);

  // 5) Wrap axios with payment interceptor
  const api = withPaymentInterceptor(axios.create({ baseURL }), viemAccount);

  try {
    const response = await api.post("", null, {
      headers: { accept: "application/json" },
    });

    const decoded = decodeXPaymentResponse(
      response.headers["x-payment-response"]
    );

    return {
      success: decoded.success,
      x402Ref: decoded.transaction,
      network: decoded.network,
      payer: decoded.payer,
      raw: decoded,
      response: response.data,
    };
  } catch (err: unknown) {
    const error = err as {
      response?: { data?: { error?: string } };
      message: string;
    };

    console.error(
      "x402 payment failed:",
      error.response?.data?.error || error.message
    );
    throw err;
  }
}
