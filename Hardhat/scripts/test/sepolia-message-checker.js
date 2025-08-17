const hre = require("hardhat");

async function main() {
  console.log("Ì¥ç Sepolia Message Checker");
  console.log("=========================");
  
  // Check if environment variable is set for easy demo
  const MIRROR_ADDRESS = process.env.MIRROR_ADDRESS || "0x1234567890123456789012345678901234567890";
  
  if (MIRROR_ADDRESS === "0x1234567890123456789012345678901234567890") {
    console.log("Ì≥ã HACKATHON DEMO STATUS:");
    console.log("‚úÖ Hedera ReputationManager: 0x2b62128E7ad12d9C437f89c1be66B00e9d000d94");
    console.log("‚ùå Sepolia ReputationMirror: Not deployed yet (need testnet ETH)");
    console.log("\nÌ≤° For full demo:");
    console.log("1. Get Sepolia ETH from faucets");
    console.log("2. Deploy ReputationMirror on Sepolia");
    console.log("3. Set MIRROR_ADDRESS=<address> and rerun this script");
    console.log("\nÌ∫∞ Sepolia Faucets:");
    console.log("   ‚Ä¢ https://sepoliafaucet.com/");
    console.log("   ‚Ä¢ https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("\nÌæØ Your address for faucets:", "0xc8c345959d3e98177E350CfB35cD10Dc718a4aFf");
    return;
  }

  console.log("Ì≥ç Checking ReputationMirror at:", MIRROR_ADDRESS);
  
  try {
    const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
    const mirror = ReputationMirror.attach(MIRROR_ADDRESS);
    
    // Check for received messages
    const [messageId, data] = await mirror.getLastReceivedMessageDetails();
    
    console.log("\nÌ≥® Last Message:");
    console.log("ID:", messageId);
    console.log("Data Length:", data.length);
    
    if (messageId === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log("‚ùå No messages received yet");
      console.log("Ì≤° Send registerAgent from Hedera first!");
      console.log("   Hedera contract: 0x2b62128E7ad12d9C437f89c1be66B00e9d000d94");
    } else {
      console.log("‚úÖ Message received!");
      console.log("Raw data:", data);
      
      // Simple decode
      if (data.length > 0) {
        const command = data[0];
        console.log("Command:", command === 1 ? "registerAgent" : command === 2 ? "finalizeTransaction" : "unknown");
      }
    }
    
    console.log("\nÌ¥ó Explorer: https://sepolia.etherscan.io/address/" + MIRROR_ADDRESS);
    
  } catch (error) {
    console.log("‚ùå Error checking contract:", error.message);
    console.log("Ì≤° Make sure the contract is deployed and address is correct");
  }
}

main().catch(console.error);
