const hre = require("hardhat");

async function main() {
  console.log("Ì∫Ä Hedera CCIP Cross-Chain Demo");
  console.log("===============================");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Ì≥ù Account:", deployer.address);
  
  const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");
  
  // Hedera testnet CCIP router and LINK token
  const hederaRouter = "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D";
  const hederaLink = "0x14375106fec3e8e2af9de8c2b8e54e6c39a6dc46"; // Hedera LINK token
  
  console.log("Ì≥Ñ Deploying ReputationManager...");
  console.log("Ì¥ó Router:", hederaRouter);
  console.log("Ì¥ó LINK:", hederaLink);
  
  const contract = await ReputationManager.deploy(hederaRouter, hederaLink);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("‚úÖ Deployed at:", address);
  console.log("Ì¥ó Explorer: https://hashscan.io/testnet/contract/" + address);
  
  console.log("\nÌ¥ß Demo Configuration:");
  console.log("1. Sepolia Chain Selector: 16015286601757825753");
  console.log("2. Set destination: contract.setDestinationReceiver(SEPOLIA_ADDRESS)");
  console.log("3. Fund with LINK tokens");
  
  console.log("\nÌ∑™ Demo Functions Ready:");
  console.log("Ì≥ã Register Agent:");
  console.log(`   contract.registerAgent("0xAgentAddress", "DemoAgent", 85)`);
  console.log("Ì≥ã Finalize Transaction:");
  console.log(`   contract.finalizeTransaction("0xSellerAddress", 2, "DEMO_TX")`);
  
  console.log("\nÌæØ Next: Run sepolia checker to see received messages!");
}

main().catch(console.error);
