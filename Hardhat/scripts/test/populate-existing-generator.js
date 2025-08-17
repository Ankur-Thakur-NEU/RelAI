const hre = require("hardhat");

async function main() {
  console.log("Ì¥ñ Populating Existing AI Data Generator");
  console.log("========================================");
  
  // Use the already deployed contract
  const contractAddress = "0x37A854dCf622988D5Abd5f4BfFa738eB0Fc65348";
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Ì±§ Account:", deployer.address);
  console.log("Ì≥ç Contract:", contractAddress);
  
  const ReputationDataGenerator = await hre.ethers.getContractFactory("ReputationDataGenerator");
  const generator = ReputationDataGenerator.attach(contractAddress);
  
  try {
    console.log("\nÔøΩÔøΩ Current stats:");
    const [agents, transactions] = await generator.getDemoStats();
    console.log("Agents:", agents.toString(), "Transactions:", transactions.toString());
    
    console.log("\nÌ¥ñ Step 1: Generating AI Agents...");
    const agentsTx = await generator.generateAIAgents({
      gasLimit: 2000000 // 2M gas
    });
    console.log("‚è≥ Transaction:", agentsTx.hash);
    await agentsTx.wait();
    console.log("‚úÖ AI Agents created!");
    
    console.log("\nÌ≤≥ Step 2: Generating AI Transactions...");
    const transactionsTx = await generator.generateAITransactions({
      gasLimit: 3000000 // 3M gas
    });
    console.log("‚è≥ Transaction:", transactionsTx.hash);
    await transactionsTx.wait();
    console.log("‚úÖ AI Transactions created!");
    
    console.log("\nÌ≥ä Final stats:");
    const [finalAgents, finalTransactions] = await generator.getDemoStats();
    console.log("Agents:", finalAgents.toString(), "Transactions:", finalTransactions.toString());
    
    console.log("\nÌæØ SUCCESS! Demo Data Created:");
    console.log("============================");
    console.log("Ì¥ñ AI Agents:");
    console.log("  ‚Ä¢ GPT-Trading-Bot");
    console.log("  ‚Ä¢ DeFi-Yield-Optimizer");
    console.log("  ‚Ä¢ NFT-Price-Predictor");
    console.log("  ‚Ä¢ Cross-Chain-Arbitrage");
    console.log("  ‚Ä¢ Risk-Assessment-AI");
    
    console.log("\nÌ≤≥ Generated 10+ transactions with ratings 2-5");
    console.log("Ìºâ Cross-chain messages simulated");
    console.log("Ì≥ä Events emitted for subgraph indexing");
    
    console.log("\nÌ∫Ä Your subgraph should now have rich AI agent data!");
    console.log("Ì≥ç Visit: https://thegraph.com/studio/subgraph/rel-aidao/");
    
  } catch (error) {
    console.log("‚ùå Error:", error.message);
    if (error.reason) console.log("Reason:", error.reason);
    
    console.log("\nÌ≤° Manual alternative:");
    console.log("Use Etherscan to call functions directly:");
    console.log("https://sepolia.etherscan.io/address/" + contractAddress + "#writeContract");
    console.log("1. Call generateAIAgents()");
    console.log("2. Call generateAITransactions()");
  }
}

main().catch(console.error);
