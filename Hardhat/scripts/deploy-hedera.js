const hre = require("hardhat");

async function main() {
  console.log("🌐 Deploying RelAI DAO to Hedera Network...");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log("  Deployer Address:", deployer.address);
  console.log("  Network:", hre.network.name);
  console.log("  Chain ID:", hre.network.config.chainId);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("  Deployer Balance:", hre.ethers.formatEther(balance), "HBAR");
  
  if (balance === 0n) {
    console.error("❌ Deployer account has no HBAR balance!");
    console.log("💡 Please fund your account at: https://portal.hedera.com/");
    return;
  }
  
  console.log("\n🚀 Starting deployment...");
  
  try {
    // Step 1: Deploy RelAI Token
    console.log("\n💰 Step 1: Deploying RelAI Governance Token...");
    const RelAIToken = await hre.ethers.getContractFactory("RelAIToken");
    const relaiToken = await RelAIToken.deploy(deployer.address, deployer.address);
    await relaiToken.waitForDeployment();
    console.log("✅ RelAI Token deployed to:", await relaiToken.getAddress());
    
    // Step 2: Deploy Timelock
    console.log("\n⏰ Step 2: Deploying Timelock Controller...");
    const RelAITimelock = await hre.ethers.getContractFactory("RelAITimelock");
    const timelock = await RelAITimelock.deploy(deployer.address);
    await timelock.waitForDeployment();
    console.log("✅ Timelock deployed to:", await timelock.getAddress());
    
    // Step 3: Deploy Mock Agent Registry (for testing)
    console.log("\n📝 Step 3: Deploying Mock Agent Registry...");
    const MockAgentRegistry = await hre.ethers.getContractFactory("MockAgentRegistry");
    const agentRegistry = await MockAgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
    console.log("✅ Mock Agent Registry deployed to:", await agentRegistry.getAddress());
    
    // Step 4: Deploy Agent DAO
    console.log("\n🏛️ Step 4: Deploying Agent DAO...");
    const AgentDAO = await hre.ethers.getContractFactory("AgentDAO");
    const agentDAO = await AgentDAO.deploy(
      await relaiToken.getAddress(),
      await agentRegistry.getAddress(),
      await timelock.getAddress()
    );
    await agentDAO.waitForDeployment();
    console.log("✅ Agent DAO deployed to:", await agentDAO.getAddress());
    
    // Step 5: Configure permissions
    console.log("\n⚙️ Step 5: Configuring permissions...");
    
    const proposerRole = await timelock.PROPOSER_ROLE();
    await timelock.grantRole(proposerRole, await agentDAO.getAddress());
    console.log("✅ Granted PROPOSER_ROLE to DAO");
    
    const adminRole = await timelock.DEFAULT_ADMIN_ROLE();
    await timelock.grantRole(adminRole, await agentDAO.getAddress());
    await timelock.revokeRole(adminRole, deployer.address);
    console.log("✅ Transferred admin role to DAO");
    
    // Step 6: Register deployer as first agent
    console.log("\n🤖 Step 6: Registering deployer as Hedera EVM agent...");
    await agentRegistry.registerAgentWithType(
      "DeployerAgent",
      "Initial deployment and configuration agent",
      "hedera_evm"
    );
    console.log("✅ Deployer registered as Hedera EVM agent");
    
    // Summary
    console.log("\n🎉 Deployment Complete!");
    console.log("========================");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("");
    console.log("📋 Contract Addresses:");
    console.log("  RelAI Token:     ", await relaiToken.getAddress());
    console.log("  Timelock:        ", await timelock.getAddress());
    console.log("  Agent Registry:  ", await agentRegistry.getAddress()); 
    console.log("  Agent DAO:       ", await agentDAO.getAddress());
    console.log("");
    console.log("🔧 DAO Configuration:");
    console.log("  Voting Delay:    ", await agentDAO.votingDelay(), "blocks");
    console.log("  Voting Period:   ", await agentDAO.votingPeriod(), "blocks");
    console.log("  Quorum:          ", "4%");
    console.log("  Fallback Voting: ", await agentDAO.fallbackVotingEnabled());
    console.log("  Agent Proposals: ", await agentDAO.agentProposalsEnabled());
    console.log("");
    console.log("💡 Next Steps:");
    console.log("  1. Update your frontend with these contract addresses");
    console.log("  2. Set up your subgraph to index these contracts");
    console.log("  3. Register more agents using the registry");
    console.log("  4. Test agent proposal submission");
    console.log("");
    console.log("🔗 Hedera Explorer:");
    if (hre.network.name === "hederaTestnet") {
      console.log("  https://hashscan.io/testnet/");
    } else if (hre.network.name === "hederaMainnet") {
      console.log("  https://hashscan.io/mainnet/");
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Fund your account with HBAR at https://portal.hedera.com/");
    } else if (error.message.includes("nonce")) {
      console.log("\n💡 Solution: Wait a moment and try again (nonce issue)");
    } else if (error.message.includes("gas")) {
      console.log("\n💡 Solution: Increase gas limit in hardhat.config.js");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
