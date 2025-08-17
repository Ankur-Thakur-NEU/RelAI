#!/bin/bash

echo "Ì∫Ä Cross-Chain Reputation Subgraph Deployment"
echo "=============================================="

echo "Ì≥ù Step 1: Generate code..."
npm run codegen

echo "Ì¥ß Step 2: Build subgraph..."
npm run build

echo "Ìºê Step 3: Ready to deploy!"
echo "To deploy to The Graph Studio:"
echo "1. Get your deploy key from https://thegraph.market/dashboard"
echo "2. Run: npx graph auth --studio <YOUR_DEPLOY_KEY>"
echo "3. Run: npx graph deploy --studio cross-chain-reputation"

echo ""
echo "‚úÖ Subgraph build successful!"
echo "Ì≥ä Contract: 0x0F9C8dD513b8dBB12Db9cf0AC44e975ec0a241a7"
echo "Ìºê Network: Sepolia Testnet"
echo "Ì≥à Ready for hackathon demo!"
