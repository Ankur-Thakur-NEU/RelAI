const hre = require("hardhat");

async function main() {
  console.log("🔥 Testing Hedera Connection with Simple DAO");
  console.log("=============================================");
  
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
    const minBalance = hre.ethers.parseEther("5"); // 5 HBAR minimum
    if (balance < minBalance) {
      console.log("\n⚠️  WARNING: Low balance for contract deployment");
      console.log("  Recommended: At least 5 HBAR for deployment");
      console.log("  Fund your account at: https://portal.hedera.com/");
      return;
    }
    
    console.log("\n✅ Account has sufficient balance for deployment");
    
    // Deploy Simple DAO for testing
    console.log("\n🚀 Deploying Simple DAO...");
    const SimpleDAO = await hre.ethers.getContractFactory("SimpleDAO");
    
    console.log("  Deploying contract...");
    const simpleDAO = await SimpleDAO.deploy(deployer.address);
    await simpleDAO.waitForDeployment();
    
    const daoAddress = await simpleDAO.getAddress();
    console.log("  ✅ Simple DAO deployed to:", daoAddress);
    
    // Test basic functionality
    console.log("\n🧪 Testing DAO functionality...");
    
    // Add deployer as voter
    console.log("  Adding deployer as voter...");
    await simpleDAO.addVoter(deployer.address);
    console.log("  ✅ Deployer added as voter");
    
    // Create a test proposal
    console.log("  Creating test proposal...");
    const proposalTx = await simpleDAO.createProposal("Test proposal for Hedera deployment");
    await proposalTx.wait();
    console.log("  ✅ Test proposal created");
    
    // Get proposal details
    const proposal = await simpleDAO.getProposal(1);
    console.log("  📋 Proposal Details:");
    console.log("    ID:", proposal.id.toString());
    console.log("    Description:", proposal.description);
    console.log("    Proposer:", proposal.proposer);
    console.log("    For Votes:", proposal.forVotes.toString());
    console.log("    Against Votes:", proposal.againstVotes.toString());
    
    // Vote on proposal
    console.log("  Casting vote...");
    const voteTx = await simpleDAO.vote(1, true);
    await voteTx.wait();
    console.log("  ✅ Vote cast successfully");
    
    // Check updated proposal
    const updatedProposal = await simpleDAO.getProposal(1);
    console.log("  📋 Updated Proposal:");
    console.log("    For Votes:", updatedProposal.forVotes.toString());
    console.log("    Against Votes:", updatedProposal.againstVotes.toString());
    
    // Network-specific information
    if (hre.network.name === "hederaTestnet") {
      console.log("\n🧪 Testnet Information:");
      console.log("  Explorer: https://hashscan.io/testnet/");
      console.log("  Contract: https://hashscan.io/testnet/contract/" + daoAddress);
    } else if (hre.network.name === "hederaMainnet") {
      console.log("\n🌐 Mainnet Information:");
      console.log("  Explorer: https://hashscan.io/mainnet/");
      console.log("  Contract: https://hashscan.io/mainnet/contract/" + daoAddress);
      console.log("  ⚠️  WARNING: This is REAL money!");
    }
    
    console.log("\n🎉 SUCCESS! Your Hedera setup is working correctly!");
    console.log("=====================================================");
    console.log("Your .env configuration is correct and ready for:");
    console.log("  ✅ Contract deployment");
    console.log("  ✅ Transaction execution");
    console.log("  ✅ DAO functionality");
    console.log("");
    console.log("📝 Contract Address: " + daoAddress);
    console.log("💡 Save this address for your frontend integration");
    
  } catch (error) {
    console.log("\n❌ Connection or deployment failed:", error.message);
    
    if (error.message.includes("could not detect network")) {
      console.log("\n💡 Solutions:");
      console.log("  1. Check your HEDERA_PRIVATE_KEY in .env file");
      console.log("  2. Verify the RPC URL is correct");
      console.log("  3. Make sure your account has been activated");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Fund your account with HBAR");
    } else if (error.message.includes("unauthorized") || error.message.includes("invalid account")) {
      console.log("\n💡 Solution: Check your private key format (should be 64 hex chars without 0x)");
    } else if (error.message.includes("gas")) {
      console.log("\n💡 Solution: The gas estimation failed, try increasing gas limits");
    }
    
    console.log("\n🔧 Debug Information:");
    console.log("  Network:", hre.network.name);
    console.log("  Error type:", error.constructor.name);
    console.log("  Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
