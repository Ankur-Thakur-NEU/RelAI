const hre = require("hardhat");

async function main() {
  console.log("� HACKATHON CROSS-CHAIN DEMO");
  console.log("==============================");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("� Demo Account:", deployer.address);
  
  if (hre.network.name === "hederaTestnet" || hre.network.name === "testnet") {
    // HEDERA SIDE
    console.log("\n� HEDERA DEMONSTRATION");
    console.log("=======================");
    
    const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");
    const router = "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D";
    
    console.log("� Deploying ReputationManager...");
    const manager = await ReputationManager.deploy(router);
    await manager.waitForDeployment();
    
    const address = await manager.getAddress();
    console.log("✅ Contract:", address);
    
    console.log("\n� DEMO READY!");
    console.log("� Manual steps needed:");
    console.log("1. Set destination: setDestinationReceiver(SEPOLIA_ADDRESS)");
    console.log("2. Allow Sepolia: allowlistDestinationChain('16015286601757825753', true)");
    console.log("3. Fund with LINK tokens");
    console.log("4. Call: registerAgent('0xDemo', 'HackathonAgent', 85)");
    
  } else if (hre.network.name === "sepolia") {
    // SEPOLIA SIDE
    console.log("\n� SEPOLIA DEMONSTRATION");
    console.log("========================");
    
    const HelloSepolia = await hre.ethers.getContractFactory("HelloSepolia");
    
    console.log("� Deploying HelloSepolia for demo...");
    const hello = await HelloSepolia.deploy("Cross-chain demo from Hedera!");
    await hello.waitForDeployment();
    
    const address = await hello.getAddress();
    console.log("✅ Contract:", address);
    console.log("� Message:", await hello.message());
    
    // Check if ReputationMirror exists and check messages
    try {
      const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
      // You'd need to deploy this first
      console.log("\n� Deploy ReputationMirror to receive CCIP messages from Hedera");
    } catch (error) {
      console.log("\n� ReputationMirror contract needed for cross-chain messages");
    }
  }
  
  console.log("\n� HACKATHON FLOW:");
  console.log("1. Deploy on Hedera ✓");
  console.log("2. Deploy on Sepolia ✓");  
  console.log("3. Configure CCIP connection");
  console.log("4. Send registerAgent from Hedera → Sepolia");
  console.log("5. Check received message on Sepolia");
  
  console.log("\n� Demo complete! Ready for presentation!");
}

main().catch(console.error);
