const hre = require("hardhat");

async function main() {
  console.log("Ì¥ñ Deploying AI Agent Demo Data Generator");
  console.log("==========================================");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Ì±§ Deploying with account:", deployer.address);
  console.log("Ìºê Network:", hre.network.name);
  
  if (hre.network.name !== "sepolia") {
    console.log("‚ùå This script must run on Sepolia network");
    console.log("   Run: npx hardhat run scripts/test/deploy-and-populate-demo-data.js --network sepolia");
    return;
  }
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Ì≤∞ Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance.toString() === "0") {
    console.log("‚ùå Insufficient funds! Need Sepolia testnet ETH");
    return;
  }
  
  try {
    console.log("\nÌ≥Ñ Deploying ReputationDataGenerator...");
    const ReputationDataGenerator = await hre.ethers.getContractFactory("ReputationDataGenerator");
    const generator = await ReputationDataGenerator.deploy();
    await generator.waitForDeployment();
    
    const generatorAddress = await generator.getAddress();
    console.log("‚úÖ ReputationDataGenerator deployed at:", generatorAddress);
    console.log("Ì¥ó Explorer: https://sepolia.etherscan.io/address/" + generatorAddress);
    
    console.log("\nÌ¥ñ Step 1: Generating AI Agents...");
    const agentsTx = await generator.generateAIAgents();
    console.log("‚è≥ Transaction hash:", agentsTx.hash);
    await agentsTx.wait();
    console.log("‚úÖ AI Agents generated!");
    
    // Wait a moment before generating transactions
    console.log("\n‚è≥ Waiting 3 seconds before generating transactions...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("\nÌ≤≥ Step 2: Generating AI Transactions & Ratings...");
    const transactionsTx = await generator.generateAITransactions();
    console.log("‚è≥ Transaction hash:", transactionsTx.hash);
    await transactionsTx.wait();
    console.log("‚úÖ AI Transactions generated!");
    
    console.log("\nÌ≥ä Getting Demo Statistics...");
    const [agentCount, transactionCount] = await generator.getDemoStats();
    console.log("Ì¥ñ Total AI Agents:", agentCount.toString());
    console.log("Ì≤≥ Total Transactions:", transactionCount.toString());
    
    console.log("\nÌæØ Demo Data Summary:");
    console.log("====================");
    console.log("AI Agents Created:");
    console.log("  ‚Ä¢ GPT-Trading-Bot (Rep: 85)");
    console.log("  ‚Ä¢ DeFi-Yield-Optimizer (Rep: 92)");
    console.log("  ‚Ä¢ NFT-Price-Predictor (Rep: 78)");
    console.log("  ‚Ä¢ Cross-Chain-Arbitrage (Rep: 95)");
    console.log("  ‚Ä¢ Risk-Assessment-AI (Rep: 88)");
    
    console.log("\nTransaction Types:");
    console.log("  ‚Ä¢ AI Trading Operations");
    console.log("  ‚Ä¢ DeFi Yield Optimization");
    console.log("  ‚Ä¢ NFT Price Predictions");
    console.log("  ‚Ä¢ Cross-chain Arbitrage");
    console.log("  ‚Ä¢ Risk Assessment Services");
    
    console.log("\nÌ¥Ñ IMPORTANT: Update Your Subgraph!");
    console.log("===================================");
    console.log("1. Add this contract address to your subgraph.yaml:");
    console.log("   ", generatorAddress);
    console.log("2. Update the startBlock to current block");
    console.log("3. Redeploy subgraph to index these events");
    console.log("\nÌ≥ä Your subgraph will now show rich AI agent data!");
    console.log("Ì∫Ä Visit: https://thegraph.com/studio/subgraph/rel-aidao/");
    
  } catch (error) {
    console.log("‚ùå Error:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("Ì≤° Need more Sepolia ETH for deployment and transactions");
    }
  }
}

main().catch(console.error);
