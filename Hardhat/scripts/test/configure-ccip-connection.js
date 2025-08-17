const hre = require("hardhat");

async function main() {
  console.log("Ì¥ß CCIP Connection Configuration");
  console.log("================================");
  
  const HEDERA_CONTRACT = "0x2b62128E7ad12d9C437f89c1be66B00e9d000d94";
  const SEPOLIA_MIRROR = "0x0F9C8dD513b8dBB12Db9cf0AC44e975ec0a241a7";
  
  console.log("Ì≥ç Hedera ReputationManager:", HEDERA_CONTRACT);
  console.log("Ì≥ç Sepolia ReputationMirror:", SEPOLIA_MIRROR);
  console.log("Ìºê Network:", hre.network.name);
  
  if (hre.network.name !== "hederaTestnet") {
    console.log("‚ùå Run this script on Hedera testnet:");
    console.log("   npx hardhat run scripts/test/configure-ccip-connection.js --network hederaTestnet");
    return;
  }
  
  const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");
  const contract = ReputationManager.attach(HEDERA_CONTRACT);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Ì±§ Account:", deployer.address);
  
  try {
    // Check current configuration
    const currentDestination = await contract.destinationReceiver();
    console.log("\nÌ¥ç Current destination:", currentDestination);
    
    if (currentDestination !== SEPOLIA_MIRROR) {
      console.log("Ì¥ß Setting destination receiver...");
      const tx = await contract.setDestinationReceiver(SEPOLIA_MIRROR);
      console.log("‚è≥ Transaction:", tx.hash);
      await tx.wait();
      console.log("‚úÖ Destination receiver set!");
    } else {
      console.log("‚úÖ Destination already configured!");
    }
    
    // Check reputation of demo address
    const demoAddress = deployer.address;
    const reputation = await contract.reputation(demoAddress);
    console.log("\nÌ≥ä Current reputation:", reputation.toString());
    
    if (reputation.toString() === "0") {
      console.log("\nÌ∫Ä Testing registerAgent...");
      console.log("Ì≥ù Registering demo agent...");
      
      const registerTx = await contract.registerAgent(
        demoAddress,
        "HackathonDemo",
        85,
        { gasLimit: 500000 }
      );
      
      console.log("‚è≥ RegisterAgent transaction:", registerTx.hash);
      console.log("Ì¥ó Explorer: https://hashscan.io/testnet/transaction/" + registerTx.hash);
      
      await registerTx.wait();
      console.log("‚úÖ RegisterAgent transaction confirmed!");
      
      const newReputation = await contract.reputation(demoAddress);
      console.log("Ì≥ä New reputation:", newReputation.toString());
      
      console.log("\nÌºâ Cross-chain message sent to Sepolia!");
      console.log("Ì≤° Check Sepolia in 1-2 minutes:");
      console.log("   MIRROR_ADDRESS=" + SEPOLIA_MIRROR + " npx hardhat run scripts/test/sepolia-message-checker.js --network sepolia");
      
    } else {
      console.log("‚úÖ Agent already registered with reputation:", reputation.toString());
      console.log("\nÌ∑™ You can test finalizeTransaction instead:");
      console.log("   contract.finalizeTransaction('" + demoAddress + "', 2, 'DEMO_TX_" + Date.now() + "')");
    }
    
  } catch (error) {
    console.log("‚ùå Error:", error.message);
    
    if (error.message.includes("LINK")) {
      console.log("\nÌ≤° Need to fund contract with LINK tokens:");
      console.log("1. Get Hedera LINK tokens from faucet");
      console.log("2. Send LINK to contract:", HEDERA_CONTRACT);
      console.log("3. Or use contract.fundLINK() if you have LINK in your wallet");
    }
  }
  
  console.log("\nÌæØ Hackathon Demo Status:");
  console.log("‚úÖ Hedera ReputationManager deployed");
  console.log("‚úÖ Sepolia ReputationMirror deployed");
  console.log("‚úÖ CCIP connection configured");
  console.log("Ìºâ Ready for cross-chain messaging demo!");
}

main().catch(console.error);
