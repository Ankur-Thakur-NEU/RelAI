const hre = require("hardhat");

async function main() {
  console.log("� Populating Existing AI Data Generator");
  console.log("========================================");
  
  // Use the already deployed contract
  const contractAddress = "0x37A854dCf622988D5Abd5f4BfFa738eB0Fc65348";
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("� Account:", deployer.address);
  console.log("� Contract:", contractAddress);
  
  const ReputationDataGenerator = await hre.ethers.getContractFactory("ReputationDataGenerator");
  const generator = ReputationDataGenerator.attach(contractAddress);
  
  try {
    console.log("\n�� Current stats:");
    const [agents, transactions] = await generator.getDemoStats();
    console.log("Agents:", agents.toString(), "Transactions:", transactions.toString());
    
    console.log("\n� Step 1: Generating AI Agents...");
    const agentsTx = await generator.generateAIAgents({
      gasLimit: 2000000 // 2M gas
    });
    console.log("⏳ Transaction:", agentsTx.hash);
    await agentsTx.wait();
    console.log("✅ AI Agents created!");
    
    console.log("\n� Step 2: Generating AI Transactions...");
    const transactionsTx = await generator.generateAITransactions({
      gasLimit: 3000000 // 3M gas
    });
    console.log("⏳ Transaction:", transactionsTx.hash);
    await transactionsTx.wait();
    console.log("✅ AI Transactions created!");
    
    console.log("\n� Final stats:");
    const [finalAgents, finalTransactions] = await generator.getDemoStats();
    console.log("Agents:", finalAgents.toString(), "Transactions:", finalTransactions.toString());
    
    console.log("\n� SUCCESS! Demo Data Created:");
    console.log("============================");
    console.log("� AI Agents:");
    console.log("  • GPT-Trading-Bot");
    console.log("  • DeFi-Yield-Optimizer");
    console.log("  • NFT-Price-Predictor");
    console.log("  • Cross-Chain-Arbitrage");
    console.log("  • Risk-Assessment-AI");
    
    console.log("\n� Generated 10+ transactions with ratings 2-5");
    console.log("� Cross-chain messages simulated");
    console.log("� Events emitted for subgraph indexing");
    
    console.log("\n� Your subgraph should now have rich AI agent data!");
    console.log("� Visit: https://thegraph.com/studio/subgraph/rel-aidao/");
    
  } catch (error) {
    console.log("❌ Error:", error.message);
    if (error.reason) console.log("Reason:", error.reason);
    
    console.log("\n� Manual alternative:");
    console.log("Use Etherscan to call functions directly:");
    console.log("https://sepolia.etherscan.io/address/" + contractAddress + "#writeContract");
    console.log("1. Call generateAIAgents()");
    console.log("2. Call generateAITransactions()");
  }
}

main().catch(console.error);
