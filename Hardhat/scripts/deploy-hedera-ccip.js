const { ethers } = require("hardhat");

/**
 * Deploy Hedera CCIP Handler and update existing AgentRegistry integration
 * 
 * This script deploys:
 * 1. Hedera CCIP Handler (receives DAO decisions from Sepolia)
 * 2. Updates AgentRegistry with CCIP integration
 * 3. Configures cross-chain communication
 */

async function main() {
  console.log("\n🚀 Deploying Hedera CCIP Integration...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // ==================== CONFIGURATION ====================
  
  const config = {
    // CCIP Config (Hedera testnet - these are placeholders)
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Will need Hedera CCIP Router
    sepoliaChainSelector: "0x0", // Will be updated with actual Sepolia CCIP chain selector
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Will need Hedera LINK
    
    // Existing contract addresses (from previous deployments)
    agentRegistry: process.env.AGENT_REGISTRY_ADDRESS || "", // From AgentDAOCore deployment
    
    // Sepolia addresses (from sepolia deployment)
    sepoliaSender: process.env.SEPOLIA_DAO_ADDRESS || "",
    sepoliaStateMirror: process.env.SEPOLIA_STATE_MIRROR || "",
  };
  
  console.log("Configuration:");
  console.log("- CCIP Router:", config.ccipRouter);
  console.log("- Sepolia Chain Selector:", config.sepoliaChainSelector);
  console.log("- Agent Registry:", config.agentRegistry);
  console.log("- Sepolia Sender:", config.sepoliaSender);

  // ==================== STEP 1: DEPLOY CCIP SENDER (for Hedera->Sepolia) ====================
  
  console.log("\n📡 Step 1: Deploying Hedera CCIP Sender...");
  
  // Reuse the same CCIP sender contract but configure for Hedera->Sepolia
  const CCIPSender = await ethers.getContractFactory("SepoliaCCIPSender");
  const hederaCCIPSender = await CCIPSender.deploy(
    config.ccipRouter,
    config.sepoliaChainSelector, // Destination is Sepolia
    config.sepoliaStateMirror || ethers.ZeroAddress, // Sepolia State Mirror
    config.linkToken
  );
  await hederaCCIPSender.waitForDeployment();
  
  console.log("✅ Hedera CCIP Sender deployed to:", await hederaCCIPSender.getAddress());

  // ==================== STEP 2: DEPLOY CCIP HANDLER ====================
  
  console.log("\n📥 Step 2: Deploying Hedera CCIP Handler...");
  
  const HederaCCIPHandler = await ethers.getContractFactory("HederaCCIPHandler");
  const ccipHandler = await HederaCCIPHandler.deploy(
    config.ccipRouter,
    config.agentRegistry || ethers.ZeroAddress, // Will be set later if not available
    config.sepoliaChainSelector,
    config.sepoliaSender || ethers.ZeroAddress // Sepolia DAO address
  );
  await ccipHandler.waitForDeployment();
  
  console.log("✅ Hedera CCIP Handler deployed to:", await ccipHandler.getAddress());

  // ==================== STEP 3: UPDATE EXISTING AGENT REGISTRY ====================
  
  console.log("\n🔗 Step 3: Configuring Agent Registry Integration...");
  
  if (config.agentRegistry && config.agentRegistry !== "") {
    try {
      // Get existing AgentDAOCore contract
      const AgentDAOCore = await ethers.getContractFactory("AgentDAOCore");
      const agentDAO = AgentDAOCore.attach(config.agentRegistry);
      
      console.log("- Found existing Agent Registry at:", config.agentRegistry);
      console.log("- Configuring CCIP integration...");
      
      // Note: This requires the AgentRegistry to have CCIP integration methods
      // If not, manual integration will be needed
      
    } catch (error) {
      console.log("⚠️  Could not automatically configure Agent Registry");
      console.log("   Manual configuration required for CCIP integration");
    }
  } else {
    console.log("⚠️  Agent Registry address not provided");
    console.log("   Please deploy Agent Registry first or provide address in .env");
  }

  // ==================== STEP 4: CONFIGURE CCIP HANDLER ====================
  
  console.log("\n⚙️ Step 4: Configuring CCIP Handler...");
  
  // Configure CCIP settings
  await ccipHandler.updateCCIPConfig(
    config.sepoliaChainSelector,
    config.sepoliaStateMirror || ethers.ZeroAddress,
    await hederaCCIPSender.getAddress(),
    true // enabled
  );
  
  // Set CCIP Handler as authorized caller for CCIP Sender
  await hederaCCIPSender.setAuthorizedCaller(await ccipHandler.getAddress(), true);
  
  console.log("✅ CCIP configurations set!");

  // ==================== STEP 5: CREATE HELPER CONTRACT ====================
  
  console.log("\n🔧 Step 5: Creating Agent Integration Helper...");
  
  // Create a simple helper contract that existing agent contracts can call
  const AgentCCIPIntegrator = await ethers.getContractFactory("contracts/hedera/AgentCCIPIntegrator.sol:AgentCCIPIntegrator");
  
  // Write the integrator contract first
  const integratorCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentCCIPIntegrator
 * @dev Helper contract for integrating existing agent contracts with CCIP
 */
contract AgentCCIPIntegrator {
    address public ccipHandler;
    mapping(address => bool) public authorizedContracts;
    
    event AgentRegistrationNotified(address indexed agent, string tag);
    event TransactionNotified(address indexed buyer, address indexed seller, int8 rating);
    event ReputationUpdateNotified(address indexed agent, int256 oldRep, int256 newRep);
    
    constructor(address _ccipHandler) {
        ccipHandler = _ccipHandler;
        authorizedContracts[msg.sender] = true;
    }
    
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "Not authorized");
        _;
    }
    
    function notifyAgentRegistration(address agent, string memory tag) external onlyAuthorized {
        bytes32 txHash = keccak256(abi.encodePacked(blockhash(block.number - 1), agent, block.timestamp));
        
        try IHederaCCIPHandler(ccipHandler).notifyAgentRegistration(agent, tag, txHash) {
            emit AgentRegistrationNotified(agent, tag);
        } catch {
            // Log but don't revert
        }
    }
    
    function notifyTransactionFinalized(
        address buyer,
        address seller,
        int8 rating,
        string memory txType,
        uint256 amount
    ) external onlyAuthorized {
        bytes32 txHash = keccak256(abi.encodePacked(blockhash(block.number - 1), buyer, seller, block.timestamp));
        
        try IHederaCCIPHandler(ccipHandler).notifyTransactionFinalized(
            buyer, seller, rating, txType, amount, txHash
        ) {
            emit TransactionNotified(buyer, seller, rating);
        } catch {
            // Log but don't revert
        }
    }
    
    function setAuthorized(address contract_, bool authorized) external {
        require(msg.sender == ccipHandler || authorizedContracts[msg.sender], "Not authorized");
        authorizedContracts[contract_] = authorized;
    }
}

interface IHederaCCIPHandler {
    function notifyAgentRegistration(address agent, string memory tag, bytes32 txHash) external;
    function notifyTransactionFinalized(address buyer, address seller, int8 rating, string memory txType, uint256 amount, bytes32 txHash) external;
}`;

  // Write the integrator contract to file system
  const fs = require('fs');
  const path = require('path');
  
  // Ensure directory exists
  const hederaDir = path.join(__dirname, '..', 'contracts', 'hedera');
  if (!fs.existsSync(hederaDir)) {
    fs.mkdirSync(hederaDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(hederaDir, 'AgentCCIPIntegrator.sol'),
    integratorCode
  );
  
  console.log("✅ AgentCCIPIntegrator contract created");
  
  // Deploy the integrator
  try {
    const AgentIntegrator = await ethers.getContractFactory("AgentCCIPIntegrator");
    const integrator = await AgentIntegrator.deploy(await ccipHandler.getAddress());
    await integrator.waitForDeployment();
    
    console.log("✅ AgentCCIPIntegrator deployed to:", await integrator.getAddress());
    
    // Authorize integrator in CCIP handler
    await ccipHandler.updateAllowlists([], [await integrator.getAddress()], [true]);
    
  } catch (error) {
    console.log("⚠️  Could not deploy AgentCCIPIntegrator:", error.message);
    console.log("   Contract code saved to contracts/hedera/AgentCCIPIntegrator.sol");
  }

  // ==================== STEP 6: VERIFICATION ====================
  
  console.log("\n✅ Hedera CCIP deployment completed!");
  console.log("\n📄 Contract Addresses:");
  console.log("=====================================");
  console.log("Hedera CCIP Handler: ", await ccipHandler.getAddress());
  console.log("Hedera CCIP Sender:  ", await hederaCCIPSender.getAddress());
  console.log("=====================================");
  
  // ==================== STEP 7: SAVE DEPLOYMENT INFO ====================
  
  const deploymentInfo = {
    network: "hedera-testnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      HederaCCIPHandler: await ccipHandler.getAddress(),
      HederaCCIPSender: await hederaCCIPSender.getAddress(),
    },
    config: config,
    integrationInstructions: {
      agentRegistryIntegration: "Manual integration required with existing AgentRegistry",
      ccipHandlerAddress: await ccipHandler.getAddress(),
      stateMirrorUpdates: "Automatic via CCIP to Sepolia State Mirror"
    }
  };
  
  fs.writeFileSync(
    'hedera-ccip-deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to: hedera-ccip-deployment.json");
  
  // ==================== STEP 8: INTEGRATION INSTRUCTIONS ====================
  
  console.log("\n📋 Integration Instructions:");
  console.log("=====================================");
  console.log("1. Update Sepolia DAO with Hedera CCIP Handler address");
  console.log("2. Update Sepolia State Mirror with Hedera CCIP Sender allowlist");
  console.log("3. Fund both CCIP senders with LINK tokens");
  console.log("4. Test cross-chain communication with a sample proposal");
  console.log("");
  console.log("🔧 For existing Agent contracts, use AgentCCIPIntegrator:");
  console.log("- Call integrator.notifyAgentRegistration(agent, tag) after registration");
  console.log("- Call integrator.notifyTransactionFinalized(...) after transactions");
  console.log("");
  console.log("⚠️  Manual Steps Required:");
  console.log("- Add reputation override function to your AgentRegistry:");
  console.log("  function overrideReputation(address agent, int256 newRep) external onlyAuthorized");
  console.log("- Authorize CCIP Handler to call AgentRegistry functions");
  console.log("- Update CCIP router and chain selector addresses with actual values");
  
  return {
    ccipHandler: await ccipHandler.getAddress(),
    ccipSender: await hederaCCIPSender.getAddress(),
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
