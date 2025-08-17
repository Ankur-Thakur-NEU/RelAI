import { paymentMiddleware } from "x402-next";

// Configure the payment middleware
export const middleware = paymentMiddleware(
  process.env.SELLER_WALLET_EVM as `0x${string}`, // your receiving wallet address
  {
    // Route configurations for protected endpoints
    "/api/x402": {
      price: "$0.01",
      network: "base-sepolia", // for mainnet, see Running on Mainnet section
      config: {
        description: "Access to protected content",
      },
    },
  },
  {
    url: "https://x402.org/facilitator", // for testnet
  }
);

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/api/x402/:path*"],
};
