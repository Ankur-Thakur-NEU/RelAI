const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deployment script for RelAI DAO Governance System
 * 
 * This script deploys the complete DAO infrastructure including:
 * - RelAI Governance Token (ERC20Votes)
 * - Mock Agent Registry (for development/testing)
 * - Timelock Controller (for governance security)
 * - Agent DAO (main governance contract)
 * 
 * Usage:
 * npx hardhat run scripts/deploy-dao.js --network localhost
 * npx hardhat run scripts/deploy-dao.js --network hederaTestnet
 */

async function main() {
  console.log("🚀 Starting RelAI DAO Deployment...\n");
  
  // Get deployment configuration
  const config = getDeploymentConfig();
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Configuration:");
  console.log("- Network:", hre.network.name);
  console.log("- Deployer:", deployer.address);
  console.log("- Initial Owner:", config.initialOwner);
  console.log("- DAO Treasury:", config.daoTreasury);
  console.log("- Emergency Council:", config.emergencyCouncil);
  console.log("- Min Delay:", config.minDelay, "seconds");
  console.log("- Voting Delay:", config.votingDelay, "blocks");
  console.log("- Voting Period:", config.votingPeriod, "blocks");
  console.log("- Quorum Fraction:", config.quorumFraction, "%");
  
  const deployedContracts = {};
  
  try {
    // Step 1: Deploy RelAI Governance Token
    console.log("\n📦 Step 1: Deploying RelAI Governance Token...");
    const RelAIToken = await ethers.getContractFactory("RelAIToken");
    const relaiToken = await RelAIToken.deploy(
      config.initialOwner,
      config.daoTreasury
    );
    await relaiToken.waitForDeployment();
    deployedContracts.relaiToken = await relaiToken.getAddress();
    
    console.log("✅ RelAI Token deployed to:", deployedContracts.relaiToken);
    console.log("   - Name:", await relaiToken.name());
    console.log("   - Symbol:", await relaiToken.symbol());
    console.log("   - Total Supply:", ethers.formatEther(await relaiToken.totalSupply()), "RELAI");
    
    // Step 2: Deploy Mock Agent Registry (replace with real one in production)
    console.log("\n📦 Step 2: Deploying Agent Registry...");
    const MockAgentRegistry = await ethers.getContractFactory("MockAgentRegistry");
    const agentRegistry = await MockAgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
    deployedContracts.agentRegistry = await agentRegistry.getAddress();
    
    console.log("✅ Agent Registry deployed to:", deployedContracts.agentRegistry);
    
    // Step 3: Deploy Timelock Controller
    console.log("\n📦 Step 3: Deploying Timelock Controller...");
    const RelAITimelock = await ethers.getContractFactory("RelAITimelock");
    const timelock = await RelAITimelock.deploy(
      config.minDelay,
      [], // proposers (will be set to DAO)
      [], // executors (will be set to DAO)
      config.initialOwner, // admin
      config.emergencyCouncil
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
    
    // Optional: Transfer ownership to timelock for full decentralization
    if (config.transferOwnership) {
      console.log("   - Transferring Agent Registry ownership to Timelock...");
      await agentRegistry.transferOwnership(deployedContracts.timelock);
      
      console.log("   - Transferring Token ownership to Timelock...");
      await relaiToken.transferOwnership(deployedContracts.timelock);
    }
    
    // Step 6: Initial Token Distribution (if configured)
    if (config.initialDistribution && config.initialDistribution.length > 0) {
      console.log("\n💰 Step 6: Performing Initial Token Distribution...");
      
      const recipients = config.initialDistribution.map(d => d.address);
      const amounts = config.initialDistribution.map(d => ethers.parseEther(d.amount.toString()));
      
      console.log("   - Distributing to", recipients.length, "recipients...");
      await relaiToken.batchDistribute(recipients, amounts);
      
      for (let i = 0; i < recipients.length; i++) {
        console.log(`   - Sent ${amounts[i]} RELAI to ${recipients[i]}`);
      }
    }
    
    // Step 7: Save Deployment Information
    console.log("\n💾 Step 7: Saving Deployment Information...");
    const deploymentInfo = {
      network: hre.network.name,
      chainId: (await ethers.provider.getNetwork()).chainId,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      gasUsed: "TBD", // Would need to track gas usage
      contracts: deployedContracts,
      config: config,
      abi: {
        relaiToken: RelAIToken.interface.fragments.map(f => f.format()),
        agentRegistry: MockAgentRegistry.interface.fragments.map(f => f.format()),
        timelock: RelAITimelock.interface.fragments.map(f => f.format()),
        agentDAO: AgentDAO.interface.fragments.map(f => f.format()),
      }
    };
    
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const filename = `dao-${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("✅ Deployment information saved to:", filepath);
    
    // Step 8: Verification Instructions
    console.log("\n🔍 Step 8: Contract Verification");
    console.log("To verify contracts on block explorer, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedContracts.relaiToken} "${config.initialOwner}" "${config.daoTreasury}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedContracts.agentRegistry}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedContracts.timelock} ${config.minDelay} "[]" "[]" "${config.initialOwner}" "${config.emergencyCouncil}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedContracts.agentDAO} "${deployedContracts.relaiToken}" "${deployedContracts.agentRegistry}" "${deployedContracts.timelock}"`);
    
    // Step 9: Next Steps
    console.log("\n🎯 Next Steps:");
    console.log("1. Verify contracts on block explorer");
    console.log("2. Set up The Graph subgraph for indexing events");
    console.log("3. Configure frontend to interact with deployed contracts");
    console.log("4. Set up monitoring and alerting for governance activities");
    console.log("5. Create initial governance proposals for system parameters");
    console.log("6. Distribute governance tokens to community members");
    
    console.log("\n🎉 RelAI DAO Deployment Complete!");
    console.log("\n📊 Summary:");
    console.log("- RelAI Token:", deployedContracts.relaiToken);
    console.log("- Agent Registry:", deployedContracts.agentRegistry);
    console.log("- Timelock Controller:", deployedContracts.timelock);
    console.log("- Agent DAO:", deployedContracts.agentDAO);
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

function getDeploymentConfig() {
  const network = hre.network.name;
  
  // Default configuration
  const defaultConfig = {
    minDelay: 86400, // 1 day
    votingDelay: 1, // 1 block
    votingPeriod: 46027, // ~7 days (assuming 13.2s blocks)
    quorumFraction: 4, // 4%
    transferOwnership: false, // Set to true for full decentralization
  };
  
  // Network-specific configurations
  const networkConfigs = {
    localhost: {
      ...defaultConfig,
      initialOwner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat account #0
      daoTreasury: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat account #1
      emergencyCouncil: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat account #2
      minDelay: 300, // 5 minutes for testing
      votingPeriod: 100, // Shorter period for testing
      initialDistribution: [
        { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", amount: 1000 }, // Account #3
        { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", amount: 1000 }, // Account #4
      ]
    },
    hederaTestnet: {
      ...defaultConfig,
      initialOwner: process.env.DEPLOYER_ADDRESS,
      daoTreasury: process.env.DAO_TREASURY_ADDRESS,
      emergencyCouncil: process.env.EMERGENCY_COUNCIL_ADDRESS,
      transferOwnership: true,
    },
    sepolia: {
      ...defaultConfig,
      initialOwner: process.env.DEPLOYER_ADDRESS,
      daoTreasury: process.env.DAO_TREASURY_ADDRESS,
      emergencyCouncil: process.env.EMERGENCY_COUNCIL_ADDRESS,
      transferOwnership: true,
    }
  };
  
  const config = networkConfigs[network] || defaultConfig;
  
  // Validate required addresses
  if (!config.initialOwner || !config.daoTreasury || !config.emergencyCouncil) {
    throw new Error(`Missing required addresses for network ${network}. Please check your configuration.`);
  }
  
  return config;
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
