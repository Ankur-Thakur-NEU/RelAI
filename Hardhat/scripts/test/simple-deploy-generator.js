const hre = require("hardhat");

async function main() {
  console.log("� Simple Deploy AI Data Generator");
  console.log("==================================");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("� Account:", deployer.address);
  console.log("� Network:", hre.network.name);
  
  console.log("\n� Deploying ReputationDataGenerator...");
  const ReputationDataGenerator = await hre.ethers.getContractFactory("ReputationDataGenerator");
  const generator = await ReputationDataGenerator.deploy();
  await generator.waitForDeployment();
  
  const address = await generator.getAddress();
  console.log("✅ Contract deployed at:", address);
  console.log("� Explorer: https://sepolia.etherscan.io/address/" + address);
  
  // Test basic function call
  console.log("\n� Testing basic function...");
  try {
    const [agents, transactions] = await generator.getDemoStats();
    console.log("Current stats - Agents:", agents.toString(), "Transactions:", transactions.toString());
    
    console.log("\n� Calling generateAIAgents with higher gas limit...");
    const tx = await generator.generateAIAgents({
      gasLimit: 1000000 // 1M gas
    });
    
    console.log("⏳ Waiting for transaction...");
    await tx.wait();
    console.log("✅ generateAIAgents successful!");
    
    const [newAgents, newTransactions] = await generator.getDemoStats();
    console.log("New stats - Agents:", newAgents.toString(), "Transactions:", newTransactions.toString());
    
  } catch (error) {
    console.log("❌ Error details:", error.message);
    if (error.reason) console.log("Reason:", error.reason);
  }
  
  console.log("\n� Contract Address:", address);
  console.log("Use this to interact with the contract manually or add to subgraph");
}

main().catch(console.error);
