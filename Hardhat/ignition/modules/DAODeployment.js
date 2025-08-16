const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

/**
 * RelAI DAO Deployment Module
 * Deploys the complete DAO governance system for RelAI
 */
module.exports = buildModule("RelAIDAOModule", (m) => {
  // Deployment parameters
  const initialOwner = m.getParameter("initialOwner");
  const daoTreasury = m.getParameter("daoTreasury");
  const emergencyCouncil = m.getParameter("emergencyCouncil", initialOwner);
  
  // DAO Configuration Parameters
  const minDelay = m.getParameter("minDelay", 86400); // 1 day
  const votingDelay = m.getParameter("votingDelay", 1); // 1 block
  const votingPeriod = m.getParameter("votingPeriod", 46027); // ~7 days
  const quorumFraction = m.getParameter("quorumFraction", 4); // 4%
  
  // Token Configuration
  const tokenName = m.getParameter("tokenName", "RelAI Governance Token");
  const tokenSymbol = m.getParameter("tokenSymbol", "RELAI");
  
  console.log("Deploying RelAI DAO with the following parameters:");
  console.log("- Initial Owner:", initialOwner);
  console.log("- DAO Treasury:", daoTreasury);
  console.log("- Emergency Council:", emergencyCouncil);
  console.log("- Min Delay:", minDelay, "seconds");
  console.log("- Voting Delay:", votingDelay, "blocks");
  console.log("- Voting Period:", votingPeriod, "blocks");
  console.log("- Quorum Fraction:", quorumFraction, "%");
  
  // Step 1: Deploy the governance token
  const relaiToken = m.contract("RelAIToken", [
    initialOwner,
    daoTreasury,
  ], {
    id: "RelAIToken",
  });
  
  // Step 2: Deploy the mock AgentRegistry for testing
  const agentRegistry = m.contract("MockAgentRegistry", [], {
    id: "MockAgentRegistry",
  });
  
  // Step 3: Deploy the timelock controller
  const timelock = m.contract("RelAITimelock", [
    minDelay,
    [], // proposers (will be set to DAO address)
    [], // executors (will be set to DAO address)
    initialOwner, // admin
    emergencyCouncil,
  ], {
    id: "RelAITimelock",
  });
  
  // Step 4: Deploy the main DAO contract
  const agentDAO = m.contract("AgentDAO", [
    relaiToken,
    agentRegistry,
    timelock,
  ], {
    id: "AgentDAO",
  });
  
  // Step 5: Configure the timelock with DAO permissions
  // Grant proposer role to DAO
  m.call(timelock, "grantRole", [
    "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1", // PROPOSER_ROLE
    agentDAO,
  ], {
    id: "GrantProposerRole",
  });
  
  // Grant executor role to DAO
  m.call(timelock, "grantRole", [
    "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63", // EXECUTOR_ROLE
    agentDAO,
  ], {
    id: "GrantExecutorRole",
  });
  
  // Step 6: Authorize the DAO to update agent registry
  m.call(agentRegistry, "setAuthorizedUpdater", [agentDAO, true], {
    id: "AuthorizeDAO",
  });
  
  // Step 7: Transfer ownership of AgentRegistry to timelock
  m.call(agentRegistry, "transferOwnership", [timelock], {
    id: "TransferRegistryOwnership",
  });
  
  // Step 8: Transfer ownership of Token to timelock (after initial distribution)
  m.call(relaiToken, "transferOwnership", [timelock], {
    id: "TransferTokenOwnership",
  });
  
  // Step 9: Revoke admin role from deployer (optional - for full decentralization)
  // This step should be done carefully and potentially through governance
  // m.call(timelock, "revokeRole", [
  //   "0x0000000000000000000000000000000000000000000000000000000000000000", // DEFAULT_ADMIN_ROLE
  //   initialOwner,
  // ], {
  //   id: "RevokeAdminRole",
  // });
  
  return {
    relaiToken,
    agentRegistry,
    timelock,
    agentDAO,
  };
});
