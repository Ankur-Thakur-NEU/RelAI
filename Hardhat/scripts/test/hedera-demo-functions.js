const hre = require("hardhat");

async function main() {
  console.log("Ì∫Ä Hedera Contract Demo Functions");
  console.log("=================================");
  
  const HEDERA_CONTRACT = "0x2b62128E7ad12d9C437f89c1be66B00e9d000d94";
  
  console.log("Ì≥ç ReputationManager:", HEDERA_CONTRACT);
  console.log("Ìºê Network:", hre.network.name);
  
  const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");
  const contract = ReputationManager.attach(HEDERA_CONTRACT);
  
  console.log("\nÌ¥ß Contract Configuration:");
  
  try {
    // Check current configuration
    const destinationReceiver = await contract.destinationReceiver();
    console.log("Ì≥ç Destination Receiver:", destinationReceiver);
    
    if (destinationReceiver === "0x0000000000000000000000000000000000000000") {
      console.log("‚ùå No destination set yet");
      console.log("Ì≤° Need to call: setDestinationReceiver(SEPOLIA_ADDRESS)");
    } else {
      console.log("‚úÖ Destination configured");
    }
    
    // Check reputation for demo address
    const demoAddress = "0xc8c345959d3e98177E350CfB35cD10Dc718a4aFf";
    const reputation = await contract.reputation(demoAddress);
    console.log("Ì≥ä Demo address reputation:", reputation.toString());
    
    console.log("\nÌ∑™ Available Functions:");
    console.log("1. registerAgent(address, tag, reputation)");
    console.log("2. finalizeTransaction(seller, rating, txRef)");
    console.log("3. setDestinationReceiver(sepoliaAddress)");
    console.log("4. fundLINK() - fund contract with LINK tokens");
    
    console.log("\nÌæØ Hackathon Demo Ready!");
    console.log("Ì≥ã Next steps:");
    console.log("1. Fund contract with LINK tokens");
    console.log("2. Set Sepolia destination (when deployed)");
    console.log("3. Call registerAgent to send cross-chain message");
    
  } catch (error) {
    console.log("‚ùå Error:", error.message);
  }
  
  console.log("\nÌ¥ó Explorer: https://hashscan.io/testnet/contract/" + HEDERA_CONTRACT);
}

main().catch(console.error);
