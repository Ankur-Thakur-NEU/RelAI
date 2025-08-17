const hre = require("hardhat");

async function main() {
  console.log("� Sepolia Message Checker");
  console.log("=========================");
  
  // Check if environment variable is set for easy demo
  const MIRROR_ADDRESS = process.env.MIRROR_ADDRESS || "0x1234567890123456789012345678901234567890";
  
  if (MIRROR_ADDRESS === "0x1234567890123456789012345678901234567890") {
    console.log("� HACKATHON DEMO STATUS:");
    console.log("✅ Hedera ReputationManager: 0x2b62128E7ad12d9C437f89c1be66B00e9d000d94");
    console.log("❌ Sepolia ReputationMirror: Not deployed yet (need testnet ETH)");
    console.log("\n� For full demo:");
    console.log("1. Get Sepolia ETH from faucets");
    console.log("2. Deploy ReputationMirror on Sepolia");
    console.log("3. Set MIRROR_ADDRESS=<address> and rerun this script");
    console.log("\n� Sepolia Faucets:");
    console.log("   • https://sepoliafaucet.com/");
    console.log("   • https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("\n� Your address for faucets:", "0xc8c345959d3e98177E350CfB35cD10Dc718a4aFf");
    return;
  }

  console.log("� Checking ReputationMirror at:", MIRROR_ADDRESS);
  
  try {
    const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
    const mirror = ReputationMirror.attach(MIRROR_ADDRESS);
    
    // Check for received messages
    const [messageId, data] = await mirror.getLastReceivedMessageDetails();
    
    console.log("\n� Last Message:");
    console.log("ID:", messageId);
    console.log("Data Length:", data.length);
    
    if (messageId === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log("❌ No messages received yet");
      console.log("� Send registerAgent from Hedera first!");
      console.log("   Hedera contract: 0x2b62128E7ad12d9C437f89c1be66B00e9d000d94");
    } else {
      console.log("✅ Message received!");
      console.log("Raw data:", data);
      
      // Simple decode
      if (data.length > 0) {
        const command = data[0];
        console.log("Command:", command === 1 ? "registerAgent" : command === 2 ? "finalizeTransaction" : "unknown");
      }
    }
    
    console.log("\n� Explorer: https://sepolia.etherscan.io/address/" + MIRROR_ADDRESS);
    
  } catch (error) {
    console.log("❌ Error checking contract:", error.message);
    console.log("� Make sure the contract is deployed and address is correct");
  }
}

main().catch(console.error);
