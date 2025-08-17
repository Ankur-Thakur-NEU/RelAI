const hre = require("hardhat");

async function main() {
  console.log("� Deploying AI Agent Demo Data Generator");
  console.log("==========================================");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("� Deploying with account:", deployer.address);
  console.log("� Network:", hre.network.name);
  
  if (hre.network.name !== "sepolia") {
    console.log("❌ This script must run on Sepolia network");
    console.log("   Run: npx hardhat run scripts/test/deploy-and-populate-demo-data.js --network sepolia");
    return;
  }
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("� Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance.toString() === "0") {
    console.log("❌ Insufficient funds! Need Sepolia testnet ETH");
    return;
  }
  
  try {
    console.log("\n� Deploying ReputationDataGenerator...");
    const ReputationDataGenerator = await hre.ethers.getContractFactory("ReputationDataGenerator");
    const generator = await ReputationDataGenerator.deploy();
    await generator.waitForDeployment();
    
    const generatorAddress = await generator.getAddress();
    console.log("✅ ReputationDataGenerator deployed at:", generatorAddress);
    console.log("� Explorer: https://sepolia.etherscan.io/address/" + generatorAddress);
    
    console.log("\n� Step 1: Generating AI Agents...");
    const agentsTx = await generator.generateAIAgents();
    console.log("⏳ Transaction hash:", agentsTx.hash);
    await agentsTx.wait();
    console.log("✅ AI Agents generated!");
    
    // Wait a moment before generating transactions
    console.log("\n⏳ Waiting 3 seconds before generating transactions...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("\n� Step 2: Generating AI Transactions & Ratings...");
    const transactionsTx = await generator.generateAITransactions();
    console.log("⏳ Transaction hash:", transactionsTx.hash);
    await transactionsTx.wait();
    console.log("✅ AI Transactions generated!");
    
    console.log("\n� Getting Demo Statistics...");
    const [agentCount, transactionCount] = await generator.getDemoStats();
    console.log("� Total AI Agents:", agentCount.toString());
    console.log("� Total Transactions:", transactionCount.toString());
    
    console.log("\n� Demo Data Summary:");
    console.log("====================");
    console.log("AI Agents Created:");
    console.log("  • GPT-Trading-Bot (Rep: 85)");
    console.log("  • DeFi-Yield-Optimizer (Rep: 92)");
    console.log("  • NFT-Price-Predictor (Rep: 78)");
    console.log("  • Cross-Chain-Arbitrage (Rep: 95)");
    console.log("  • Risk-Assessment-AI (Rep: 88)");
    
    console.log("\nTransaction Types:");
    console.log("  • AI Trading Operations");
    console.log("  • DeFi Yield Optimization");
    console.log("  • NFT Price Predictions");
    console.log("  • Cross-chain Arbitrage");
    console.log("  • Risk Assessment Services");
    
    console.log("\n� IMPORTANT: Update Your Subgraph!");
    console.log("===================================");
    console.log("1. Add this contract address to your subgraph.yaml:");
    console.log("   ", generatorAddress);
    console.log("2. Update the startBlock to current block");
    console.log("3. Redeploy subgraph to index these events");
    console.log("\n� Your subgraph will now show rich AI agent data!");
    console.log("� Visit: https://thegraph.com/studio/subgraph/rel-aidao/");
    
  } catch (error) {
    console.log("❌ Error:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("� Need more Sepolia ETH for deployment and transactions");
    }
  }
}

main().catch(console.error);
