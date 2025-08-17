// If using .ts
export const reputationManagerAbi = [
  {
    inputs: [
      { internalType: "address", name: "seller", type: "address" },
      { internalType: "uint256", name: "rating", type: "uint256" },
      { internalType: "string", name: "x402Ref", type: "string" },
    ],
    name: "finalizeTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
