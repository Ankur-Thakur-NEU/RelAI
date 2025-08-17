const hre = require("hardhat");

async function main() {
  console.log("ÌøÜ HACKATHON CROSS-CHAIN DEMO");
  console.log("==============================");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Ì±§ Demo Account:", deployer.address);
  
  if (hre.network.name === "hederaTestnet" || hre.network.name === "testnet") {
    // HEDERA SIDE
    console.log("\nÌºê HEDERA DEMONSTRATION");
    console.log("=======================");
    
    const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");
    const router = "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D";
    
    console.log("Ì≥Ñ Deploying ReputationManager...");
    const manager = await ReputationManager.deploy(router);
    await manager.waitForDeployment();
    
    const address = await manager.getAddress();
    console.log("‚úÖ Contract:", address);
    
    console.log("\nÌ≥ã DEMO READY!");
    console.log("Ì¥ß Manual steps needed:");
    console.log("1. Set destination: setDestinationReceiver(SEPOLIA_ADDRESS)");
    console.log("2. Allow Sepolia: allowlistDestinationChain('16015286601757825753', true)");
    console.log("3. Fund with LINK tokens");
    console.log("4. Call: registerAgent('0xDemo', 'HackathonAgent', 85)");
    
  } else if (hre.network.name === "sepolia") {
    // SEPOLIA SIDE
    console.log("\nÌºê SEPOLIA DEMONSTRATION");
    console.log("========================");
    
    const HelloSepolia = await hre.ethers.getContractFactory("HelloSepolia");
    
    console.log("Ì≥Ñ Deploying HelloSepolia for demo...");
    const hello = await HelloSepolia.deploy("Cross-chain demo from Hedera!");
    await hello.waitForDeployment();
    
    const address = await hello.getAddress();
    console.log("‚úÖ Contract:", address);
    console.log("Ì≥® Message:", await hello.message());
    
    // Check if ReputationMirror exists and check messages
    try {
      const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
      // You'd need to deploy this first
      console.log("\nÌ≤° Deploy ReputationMirror to receive CCIP messages from Hedera");
    } catch (error) {
      console.log("\nÌ≤° ReputationMirror contract needed for cross-chain messages");
    }
  }
  
  console.log("\nÌæØ HACKATHON FLOW:");
  console.log("1. Deploy on Hedera ‚úì");
  console.log("2. Deploy on Sepolia ‚úì");  
  console.log("3. Configure CCIP connection");
  console.log("4. Send registerAgent from Hedera ‚Üí Sepolia");
  console.log("5. Check received message on Sepolia");
  
  console.log("\nÌøÜ Demo complete! Ready for presentation!");
}

main().catch(console.error);
