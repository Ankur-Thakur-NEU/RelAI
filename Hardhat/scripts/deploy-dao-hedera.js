const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Simplified deployment script for Hedera testnet using the connected account
 * for all roles (deployer, treasury, emergency council)
 */
async function main() {
  console.log("🚀 Starting RelAI DAO Deployment on Hedera...\n");
  
  // Check if we're on Hedera network
  if (!hre.network.name.includes('hedera')) {
    console.log("❌ Not connected to Hedera network");
    console.log("💡 Use: --network hederaTestnet");
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  
  console.log("📋 Deployment Configuration:");
  console.log("- Network:", hre.network.name);
  console.log("- Deployer:", deployerAddress);
  console.log("- DAO Treasury:", deployerAddress, "(using deployer address)");
  console.log("- Emergency Council:", deployerAddress, "(using deployer address)");
  console.log("- Balance:", ethers.formatEther(await deployer.provider.getBalance(deployerAddress)), "HBAR");
  
  const deployedContracts = {};
  
  try {
    // Step 1: Deploy RelAI Governance Token
    console.log("\n📦 Step 1: Deploying RelAI Governance Token...");
    const RelAIToken = await ethers.getContractFactory("RelAIToken");
    const relaiToken = await RelAIToken.deploy(
      deployerAddress, // initialOwner
      deployerAddress  // daoTreasury
    );
    await relaiToken.waitForDeployment();
    deployedContracts.relaiToken = await relaiToken.getAddress();
    
    console.log("✅ RelAI Token deployed to:", deployedContracts.relaiToken);
    console.log("   - Name:", await relaiToken.name());
    console.log("   - Symbol:", await relaiToken.symbol());
    console.log("   - Total Supply:", ethers.formatEther(await relaiToken.totalSupply()), "RELAI");
    
    // Step 2: Deploy Mock Agent Registry
    console.log("\n📦 Step 2: Deploying Mock Agent Registry...");
    const MockAgentRegistry = await ethers.getContractFactory("MockAgentRegistry");
    const agentRegistry = await MockAgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
    deployedContracts.agentRegistry = await agentRegistry.getAddress();
    
    console.log("✅ Agent Registry deployed to:", deployedContracts.agentRegistry);
    
    // Step 3: Deploy Timelock Controller
    console.log("\n📦 Step 3: Deploying Timelock Controller...");
    const RelAITimelock = await ethers.getContractFactory("RelAITimelock");
    const timelock = await RelAITimelock.deploy(
      86400,          // minDelay: 1 day
      [],             // proposers (will be set to DAO)
      [],             // executors (will be set to DAO)
      deployerAddress, // admin
      deployerAddress  // emergencyCouncil
    );
    await timelock.waitForDeployment();
    deployedContracts.timelock = await timelock.getAddress();
    
    console.log("✅ Timelock Controller deployed to:", deployedContracts.timelock);
    console.log("   - Min Delay:", await timelock.getMinDelay(), "seconds");
    console.log("   - Emergency Council:", await timelock.emergencyCouncil());
    
    // Step 4: Deploy Agent DAO
    console.log("\n📦 Step 4: Deploying Agent DAO...");
    const AgentDAO = await ethers.getContractFactory("AgentDAO");
    const agentDAO = await AgentDAO.deploy(
      deployedContracts.relaiToken,
      deployedContracts.agentRegistry,
      deployedContracts.timelock
    );
    await agentDAO.waitForDeployment();
    deployedContracts.agentDAO = await agentDAO.getAddress();
    
    console.log("✅ Agent DAO deployed to:", deployedContracts.agentDAO);
    console.log("   - Name:", await agentDAO.name());
    console.log("   - Voting Delay:", await agentDAO.votingDelay(), "blocks");
    console.log("   - Voting Period:", await agentDAO.votingPeriod(), "blocks");
    console.log("   - Quorum:", ethers.formatEther(await agentDAO.quorum(await ethers.provider.getBlockNumber())), "RELAI");
    console.log("   - Fallback Voting Enabled:", await agentDAO.fallbackVotingEnabled());
    console.log("   - Registry Address:", await agentDAO.registry());
    console.log("   - Agent Proposals Enabled:", await agentDAO.agentProposalsEnabled());
    console.log("   - Max Agent Proposals Per Day:", await agentDAO.maxAgentProposalsPerDay());
    
    // Step 5: Configure Permissions
    console.log("\n⚙️  Step 5: Configuring Permissions...");
    
    // Grant DAO roles to timelock
    const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
    const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
    
    console.log("   - Granting PROPOSER_ROLE to DAO...");
    await timelock.grantRole(PROPOSER_ROLE, deployedContracts.agentDAO);
    
    console.log("   - Granting EXECUTOR_ROLE to DAO...");
    await timelock.grantRole(EXECUTOR_ROLE, deployedContracts.agentDAO);
    
    // Authorize DAO to update agent registry
    console.log("   - Authorizing DAO to update Agent Registry...");
    await agentRegistry.setAuthorizedUpdater(deployedContracts.agentDAO, true);
    
    // Step 6: Test basic functionality
    console.log("\n🧪 Step 6: Testing Basic Functionality...");
    
    // Register deployer as an agent
    console.log("   - Registering deployer as test agent...");
    await agentRegistry.registerAgentWithType(
      "RelAI Deployer Agent",
      "Deployment and testing agent for RelAI DAO",
      "deployment_agent"
    );
    
    const agentInfo = await agentRegistry.getAgentInfo(deployerAddress);
    console.log("   - Agent registered with reputation:", agentInfo.reputation.toString());
    
    console.log("\n🎉 RelAI DAO Deployment Complete!");
    console.log("\n📊 Summary:");
    console.log("- RelAI Token:", deployedContracts.relaiToken);
    console.log("- Agent Registry:", deployedContracts.agentRegistry);
    console.log("- Timelock Controller:", deployedContracts.timelock);
    console.log("- Agent DAO:", deployedContracts.agentDAO);
    
    console.log("\n🌐 Hedera Block Explorer:");
    console.log("- RelAI Token: https://hashscan.io/testnet/contract/" + deployedContracts.relaiToken);
    console.log("- Agent Registry: https://hashscan.io/testnet/contract/" + deployedContracts.agentRegistry);  
    console.log("- Timelock: https://hashscan.io/testnet/contract/" + deployedContracts.timelock);
    console.log("- Agent DAO: https://hashscan.io/testnet/contract/" + deployedContracts.agentDAO);
    
    console.log("\n🔧 Next Steps:");
    console.log("1. ✅ All Step 1-3 DAO features deployed and working");
    console.log("2. 🎯 Ready for frontend integration");
    console.log("3. 📊 Ready for The Graph subgraph setup");
    console.log("4. 🤖 AI agents can now interact with the DAO");
    console.log("5. 🌉 Cross-chain functionality available");
    
    return deployedContracts;
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { main };
