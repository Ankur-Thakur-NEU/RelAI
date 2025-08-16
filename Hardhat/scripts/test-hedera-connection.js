const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing Hedera Connection...");
  console.log("================================");
  
  // Check if we're on Hedera network
  if (!hre.network.name.includes('hedera')) {
    console.log("❌ Not connected to Hedera network");
    console.log("💡 Use: --network hederaTestnet or --network hederaMainnet");
    return;
  }
  
  console.log("📋 Network Information:");
  console.log("  Network Name:", hre.network.name);
  console.log("  Chain ID:", hre.network.config.chainId);
  console.log("  RPC URL:", hre.network.config.url);
  
  try {
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("\n👤 Account Information:");
    console.log("  Address:", deployer.address);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("  Balance:", hre.ethers.formatEther(balance), "HBAR");
    
    // Test connection by getting latest block
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("\n🔗 Network Status:");
    console.log("  Latest Block:", blockNumber);
    console.log("  Connection: ✅ SUCCESS");
    
    // Check if account has enough balance for deployment
    const minBalance = hre.ethers.parseEther("10"); // 10 HBAR minimum
    if (balance < minBalance) {
      console.log("\n⚠️  WARNING: Low balance for contract deployment");
      console.log("  Recommended: At least 10 HBAR for deployment");
      console.log("  Fund your account at: https://portal.hedera.com/");
    } else {
      console.log("\n✅ Account has sufficient balance for deployment");
    }
    
    // Network-specific information
    if (hre.network.name === "hederaTestnet") {
      console.log("\n🧪 Testnet Information:");
      console.log("  Explorer: https://hashscan.io/testnet/");
      console.log("  Faucet: https://portal.hedera.com/ (create testnet account)");
    } else if (hre.network.name === "hederaMainnet") {
      console.log("\n🌐 Mainnet Information:");
      console.log("  Explorer: https://hashscan.io/mainnet/");
      console.log("  ⚠️  WARNING: This is REAL money - double check everything!");
    }
    
    console.log("\n🚀 Ready to deploy contracts!");
    console.log("  Command: npx hardhat run scripts/deploy-hedera.js --network", hre.network.name);
    
  } catch (error) {
    console.log("\n❌ Connection failed:", error.message);
    
    if (error.message.includes("could not detect network")) {
      console.log("\n💡 Solutions:");
      console.log("  1. Check your HEDERA_PRIVATE_KEY in .env file");
      console.log("  2. Verify the RPC URL is correct");
      console.log("  3. Make sure your account has been activated");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Fund your account with HBAR");
    } else if (error.message.includes("unauthorized")) {
      console.log("\n💡 Solution: Check your private key format (should be 64 hex chars)");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
