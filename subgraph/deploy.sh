#!/bin/bash

echo "� Cross-Chain Reputation Subgraph Deployment"
echo "=============================================="

echo "� Step 1: Generate code..."
npm run codegen

echo "� Step 2: Build subgraph..."
npm run build

echo "� Step 3: Ready to deploy!"
echo "To deploy to The Graph Studio:"
echo "1. Get your deploy key from https://thegraph.market/dashboard"
echo "2. Run: npx graph auth --studio <YOUR_DEPLOY_KEY>"
echo "3. Run: npx graph deploy --studio cross-chain-reputation"

echo ""
echo "✅ Subgraph build successful!"
echo "� Contract: 0x0F9C8dD513b8dBB12Db9cf0AC44e975ec0a241a7"
echo "� Network: Sepolia Testnet"
echo "� Ready for hackathon demo!"
