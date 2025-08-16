const { ethers } = require("hardhat");

/**
 * Deploy complete Sepolia DAO system with CCIP integration
 * 
 * This script deploys:
 * 1. RelAI Governance Token
 * 2. RelAI Timelock Controller  
 * 3. Sepolia DAO (with CCIP sender integration)
 * 4. Sepolia CCIP Sender
 * 5. Sepolia State Mirror (for Hedera state mirroring)
 */

async function main() {
  console.log("\n🚀 Deploying Sepolia DAO System with CCIP Integration...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // ==================== CONFIGURATION ====================
  
  const config = {
    // Governance Token Config
    tokenName: "RelAI Governance Token",
    tokenSymbol: "RELAI",
    initialSupply: ethers.parseEther("1000000"), // 1M tokens
    
    // Timelock Config
    timelockDelay: 24 * 60 * 60, // 24 hours
    
    // DAO Config  
    votingDelay: 1, // 1 block
    votingPeriod: 46027, // ~7 days (assuming 13s block time)
    quorumPercentage: 4, // 4%
    proposalThreshold: 0, // 0 tokens required to propose
    
    // CCIP Config (Sepolia testnet)
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Sepolia CCIP Router
    hederaChainSelector: "0x0", // Will be updated with actual Hedera CCIP chain selector
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // LINK on Sepolia
    
    // Addresses that will be set up
    daoTreasury: "", // Will be set to deployer initially
    emergencyCouncil: "", // Will be set to deployer initially
  };
  
  // Set default addresses to deployer if not provided
  config.daoTreasury = process.env.DAO_TREASURY_ADDRESS || deployer.address;
  config.emergencyCouncil = process.env.EMERGENCY_COUNCIL_ADDRESS || deployer.address;
  
  console.log("Configuration:");
  console.log("- DAO Treasury:", config.daoTreasury);
  console.log("- Emergency Council:", config.emergencyCouncil);
  console.log("- CCIP Router:", config.ccipRouter);
  console.log("- LINK Token:", config.linkToken);

  // ==================== STEP 1: DEPLOY GOVERNANCE TOKEN ====================
  
  console.log("\n📊 Step 1: Deploying Governance Token...");
  
  const RelAIToken = await ethers.getContractFactory("RelAIToken");
  const token = await RelAIToken.deploy(
    config.tokenName,
    config.tokenSymbol,
    config.initialSupply,
    deployer.address // Initial owner
  );
  await token.waitForDeployment();
  
  console.log("✅ RelAI Token deployed to:", await token.getAddress());
  
  // ==================== STEP 2: DEPLOY TIMELOCK ====================
  
  console.log("\n⏰ Step 2: Deploying Timelock Controller...");
  
  const RelAITimelock = await ethers.getContractFactory("RelAITimelock");
  const timelock = await RelAITimelock.deploy(
    config.timelockDelay,
    [config.emergencyCouncil], // proposers
    [config.emergencyCouncil], // executors  
    deployer.address // admin (will be renounced later)
  );
  await timelock.waitForDeployment();
  
  console.log("✅ RelAI Timelock deployed to:", await timelock.getAddress());

  // ==================== STEP 3: DEPLOY CCIP SENDER ====================
  
  console.log("\n📡 Step 3: Deploying CCIP Sender...");
  
  const SepoliaCCIPSender = await ethers.getContractFactory("SepoliaCCIPSender");
  const ccipSender = await SepoliaCCIPSender.deploy(
    config.ccipRouter,
    config.hederaChainSelector, // Will need to update this
    ethers.ZeroAddress, // Hedera receiver - will be set later
    config.linkToken
  );
  await ccipSender.waitForDeployment();
  
  console.log("✅ CCIP Sender deployed to:", await ccipSender.getAddress());

  // ==================== STEP 4: DEPLOY STATE MIRROR ====================
  
  console.log("\n🪞 Step 4: Deploying State Mirror...");
  
  const SepoliaStateMirror = await ethers.getContractFactory("SepoliaStateMirror");
  const stateMirror = await SepoliaStateMirror.deploy(
    config.ccipRouter,
    config.hederaChainSelector,
    ethers.ZeroAddress // Hedera sender - will be set later
  );
  await stateMirror.waitForDeployment();
  
  console.log("✅ State Mirror deployed to:", await stateMirror.getAddress());

  // ==================== STEP 5: DEPLOY DAO ====================
  
  console.log("\n🏛️ Step 5: Deploying Sepolia DAO...");
  
  const SepoliaDAO = await ethers.getContractFactory("SepoliaDAO");
  const dao = await SepoliaDAO.deploy(
    await token.getAddress(),
    await timelock.getAddress(),
    await ccipSender.getAddress(),
    config.hederaChainSelector,
    ethers.ZeroAddress // Hedera agent manager - will be set later
  );
  await dao.waitForDeployment();
  
  console.log("✅ Sepolia DAO deployed to:", await dao.getAddress());

  // ==================== STEP 6: SETUP PERMISSIONS ====================
  
  console.log("\n🔐 Step 6: Setting up permissions...");
  
  // Grant DAO as authorized caller for CCIP Sender
  console.log("- Authorizing DAO to use CCIP Sender...");
  await ccipSender.setAuthorizedCaller(await dao.getAddress(), true);
  
  // Setup timelock roles
  console.log("- Setting up timelock roles...");
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  
  await timelock.grantRole(PROPOSER_ROLE, await dao.getAddress());
  await timelock.grantRole(EXECUTOR_ROLE, await dao.getAddress());
  
  // Delegate tokens to enable voting
  console.log("- Delegating tokens for voting...");
  await token.delegate(deployer.address);
  
  console.log("✅ Permissions configured!");

  // ==================== STEP 7: VERIFICATION ====================
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📄 Contract Addresses:");
  console.log("=====================================");
  console.log("RelAI Token:          ", await token.getAddress());
  console.log("RelAI Timelock:       ", await timelock.getAddress());
  console.log("Sepolia DAO:          ", await dao.getAddress());
  console.log("CCIP Sender:          ", await ccipSender.getAddress());  
  console.log("State Mirror:         ", await stateMirror.getAddress());
  console.log("=====================================");
  
  // ==================== STEP 8: SAVE DEPLOYMENT INFO ====================
  
  const deploymentInfo = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      RelAIToken: await token.getAddress(),
      RelAITimelock: await timelock.getAddress(),
      SepoliaDAO: await dao.getAddress(),
      SepoliaCCIPSender: await ccipSender.getAddress(),
      SepoliaStateMirror: await stateMirror.getAddress(),
    },
    config: config
  };
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'sepolia-deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to: sepolia-deployment.json");
  
  // ==================== STEP 9: SETUP INSTRUCTIONS ====================
  
  console.log("\n📋 Next Steps:");
  console.log("=====================================");
  console.log("1. Deploy Hedera contracts using deploy-hedera-ccip.js");
  console.log("2. Update CCIP configurations with actual chain selectors");
  console.log("3. Fund CCIP Sender with LINK tokens for cross-chain messages");
  console.log("4. Configure allowlists for cross-chain communication");
  console.log("5. Test with a sample DAO proposal");
  console.log("\n⚠️  IMPORTANT:");
  console.log("- Update hederaChainSelector in config once deployed");
  console.log("- Update Hedera receiver addresses once deployed");
  console.log("- Fund contracts with LINK for CCIP fees");
  
  return {
    token: await token.getAddress(),
    timelock: await timelock.getAddress(),
    dao: await dao.getAddress(),
    ccipSender: await ccipSender.getAddress(),
    stateMirror: await stateMirror.getAddress()
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
