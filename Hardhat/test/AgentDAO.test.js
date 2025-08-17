const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("RelAI DAO Governance System", function () {
  // Test fixture to deploy contracts
  async function deployDAOFixture() {
    const [deployer, user1, user2, user3, maliciousAgent, emergencyCouncil] = await ethers.getSigners();
    
    // Deploy RelAI Token
    const RelAIToken = await ethers.getContractFactory("RelAIToken");
    const relaiToken = await RelAIToken.deploy(deployer.address, deployer.address);
    
    // Deploy Mock Agent Registry
    const MockAgentRegistry = await ethers.getContractFactory("MockAgentRegistry");
    const agentRegistry = await MockAgentRegistry.deploy();
    
    // Deploy Timelock Controller
    const RelAITimelock = await ethers.getContractFactory("RelAITimelock");
    const timelock = await RelAITimelock.deploy(
      86400, // 1 day delay
      [], // proposers
      [], // executors  
      deployer.address, // admin
      emergencyCouncil.address
    );
    
    // Deploy Agent DAO
    const AgentDAO = await ethers.getContractFactory("AgentDAO");
    const agentDAO = await AgentDAO.deploy(
      relaiToken.target,
      agentRegistry.target,
      timelock.target
    );
    
    // Configure timelock permissions
    const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
    const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
    
    await timelock.grantRole(PROPOSER_ROLE, agentDAO.target);
    await timelock.grantRole(EXECUTOR_ROLE, agentDAO.target);
    
    // Authorize DAO to update agent registry
    await agentRegistry.setAuthorizedUpdater(agentDAO.target, true);
    
    // Distribute tokens to users for voting
    const tokenAmount = ethers.parseEther("1000");
    await relaiToken.transfer(user1.address, tokenAmount);
    await relaiToken.transfer(user2.address, tokenAmount);
    await relaiToken.transfer(user3.address, tokenAmount);
    
    // Delegate votes to enable governance participation
    await relaiToken.connect(user1).delegate(user1.address);
    await relaiToken.connect(user2).delegate(user2.address);
    await relaiToken.connect(user3).delegate(user3.address);
    
    // Register test agents
    await agentRegistry.connect(maliciousAgent).registerAgent("MaliciousAI", "Bad capabilities");
    
    // Register agents with types for Step 3 testing
    await agentRegistry.connect(user1).registerAgentWithType("HederaAgent1", "Hedera EVM agent", "hedera_evm");
    await agentRegistry.connect(user2).registerAgentWithType("AIAgent2", "AI automation agent", "ai_agent");
    
    return {
      relaiToken,
      agentRegistry,
      timelock,
      agentDAO,
      deployer,
      user1,
      user2,
      user3,
      maliciousAgent,
      emergencyCouncil,
      PROPOSER_ROLE,
      EXECUTOR_ROLE
    };
  }
  
  describe("Deployment", function () {
    it("Should deploy all contracts with correct initial state", async function () {
      const { relaiToken, agentRegistry, timelock, agentDAO, deployer } = await loadFixture(deployDAOFixture);
      
      expect(await relaiToken.name()).to.equal("RelAI Governance Token");
      expect(await relaiToken.symbol()).to.equal("RELAI");
      expect(await relaiToken.owner()).to.equal(deployer.address);
      
      expect(await agentDAO.registry()).to.equal(agentRegistry.target);
      expect(await agentDAO.name()).to.equal("AgentDAO");
      
      expect(await agentDAO.votingDelay()).to.equal(1);
      expect(await agentDAO.votingPeriod()).to.equal(46027);
      expect(await agentDAO.quorum(await time.latestBlock())).to.be.gt(0);
    });
    
    it("Should have correct permissions setup", async function () {
      const { timelock, agentDAO, PROPOSER_ROLE, EXECUTOR_ROLE } = await loadFixture(deployDAOFixture);
      
      expect(await timelock.hasRole(PROPOSER_ROLE, agentDAO.target)).to.be.true;
      expect(await timelock.hasRole(EXECUTOR_ROLE, agentDAO.target)).to.be.true;
    });
  });
  
  describe("Token Distribution", function () {
    it("Should distribute tokens correctly", async function () {
      const { relaiToken, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      const expectedBalance = ethers.parseEther("1000");
      expect(await relaiToken.balanceOf(user1.address)).to.equal(expectedBalance);
      expect(await relaiToken.balanceOf(user2.address)).to.equal(expectedBalance);
      expect(await relaiToken.balanceOf(user3.address)).to.equal(expectedBalance);
    });
    
    it("Should enable voting power through delegation", async function () {
      const { relaiToken, user1 } = await loadFixture(deployDAOFixture);
      
      const votingPower = await relaiToken.getVotes(user1.address);
      expect(votingPower).to.equal(ethers.parseEther("1000"));
    });
  });
  
  describe("Agent Registry Integration", function () {
    it("Should allow agents to register", async function () {
      const { agentRegistry, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const agent = await agentRegistry.agents(maliciousAgent.address);
      expect(agent.isRegistered).to.be.true;
      expect(agent.name).to.equal("MaliciousAI");
      expect(agent.reputation).to.equal(1000); // Starting reputation
    });
    
    it("Should track agent reputation", async function () {
      const { agentRegistry, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const reputation = await agentRegistry.getAgentReputation(maliciousAgent.address);
      expect(reputation).to.equal(1000);
    });
  });
  
  describe("DAO Governance - Reputation Updates", function () {
    it("Should allow creating reputation update proposals", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      const reputationDelta = -100;
      const reason = "Poor performance on task";
      
      await expect(
        agentDAO.connect(user1).proposeReputationUpdate(
          maliciousAgent.address,
          reputationDelta,
          reason
        )
      ).to.emit(agentDAO, "ProposalCreatedWithType")
       .withArgs(
         1, // proposal ID
         user1.address,
         0, // ProposalType.REPUTATION_UPDATE
         maliciousAgent.address,
         anyValue, // description
         anyValue  // timestamp
       );
    });
    
    it("Should prevent unauthorized reputation updates", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).proposeReputationUpdate(
          ethers.ZeroAddress, // unregistered agent
          -100,
          "Test reason"
        )
      ).to.be.revertedWith("Agent not registered");
    });
    
    it("Should execute reputation update proposal after voting", async function () {
      const { agentDAO, agentRegistry, maliciousAgent, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Create proposal
      const tx = await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -200,
        "Consistently poor performance"
      );
      const receipt = await tx.wait();
      const proposalId = 1;
      
      // Wait for voting delay
      await time.increase(1);
      
      // Vote on proposal
      await agentDAO.connect(user1).castVote(proposalId, 1); // For
      await agentDAO.connect(user2).castVote(proposalId, 1); // For
      await agentDAO.connect(user3).castVote(proposalId, 1); // For
      
      // Wait for voting period to end
      await time.increase(46028);
      
      // Queue proposal (since we have timelock)
      const proposal = await agentDAO.proposalData(proposalId);
      const targets = [agentRegistry.target];
      const values = [0];
      const calldatas = [
        agentRegistry.interface.encodeFunctionData("updateReputation", [
          maliciousAgent.address,
          -200
        ])
      ];
      const description = "Update reputation for agent " + maliciousAgent.address;
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
      
      await agentDAO.queue(targets, values, calldatas, descriptionHash);
      
      // Wait for timelock delay
      await time.increase(86401);
      
      // Execute proposal
      const oldReputation = await agentRegistry.getAgentReputation(maliciousAgent.address);
      
      await expect(
        agentDAO.execute(targets, values, calldatas, descriptionHash)
      ).to.emit(agentDAO, "ProposalExecutedWithDetails");
      
      // Verify reputation was updated
      const newReputation = await agentRegistry.getAgentReputation(maliciousAgent.address);
      expect(newReputation).to.equal(oldReputation - 200n);
    });
  });
  
  describe("DAO Governance - Malicious Agent Reports", function () {
    it("Should allow authorized reporters to report malicious agents", async function () {
      const { agentDAO, maliciousAgent, deployer } = await loadFixture(deployDAOFixture);
      
      // Deployer is authorized by default
      await expect(
        agentDAO.connect(deployer).reportMaliciousAgent(
          maliciousAgent.address,
          "Agent deleted test cases to hide failures",
          500
        )
      ).to.emit(agentDAO, "AgentReported");
    });
    
    it("Should prevent unauthorized users from reporting", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).reportMaliciousAgent(
          maliciousAgent.address,
          "Evidence of malicious behavior",
          500
        )
      ).to.be.revertedWith("Not authorized reporter");
    });
    
    it("Should enforce slash amount limits", async function () {
      const { agentDAO, maliciousAgent, deployer } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(deployer).reportMaliciousAgent(
          maliciousAgent.address,
          "Evidence",
          2000 // Above limit of 1000
        )
      ).to.be.revertedWith("Slash amount too high");
    });
  });
  
  describe("DAO Governance - Blacklisting", function () {
    it("Should allow proposing to blacklist agents", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).proposeBlacklistAgent(
          maliciousAgent.address,
          true,
          "Repeated malicious behavior across multiple tasks"
        )
      ).to.emit(agentDAO, "ProposalCreatedWithType")
       .withArgs(
         1,
         user1.address,
         3, // ProposalType.BLACKLIST_AGENT
         maliciousAgent.address,
         anyValue,
         anyValue
       );
    });
  });
  
  describe("Administrative Functions", function () {
    it("Should allow owner to authorize reporters", async function () {
      const { agentDAO, user1, deployer } = await loadFixture(deployDAOFixture);
      
      expect(await agentDAO.isAuthorizedReporter(user1.address)).to.be.false;
      
      await agentDAO.connect(deployer).setAuthorizedReporter(user1.address, true);
      
      expect(await agentDAO.isAuthorizedReporter(user1.address)).to.be.true;
    });
    
    it("Should allow owner to update parameters", async function () {
      const { agentDAO, deployer } = await loadFixture(deployDAOFixture);
      
      const oldInterval = await agentDAO.minProposalInterval();
      const newInterval = 7200; // 2 hours
      
      await agentDAO.connect(deployer).updateMinProposalInterval(newInterval);
      
      expect(await agentDAO.minProposalInterval()).to.equal(newInterval);
    });
  });
  
  describe("Rate Limiting", function () {
    it("Should enforce proposal rate limiting", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      // First proposal should succeed
      await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -50,
        "First report"
      );
      
      // Second proposal immediately should fail
      await expect(
        agentDAO.connect(user1).proposeReputationUpdate(
          maliciousAgent.address,
          -50,
          "Second report"
        )
      ).to.be.revertedWith("Proposal rate limited");
    });
    
    it("Should allow proposals after rate limit period", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      // First proposal
      await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -50,
        "First report"
      );
      
      // Wait for rate limit period
      await time.increase(3601); // > 1 hour
      
      // Second proposal should now succeed
      await expect(
        agentDAO.connect(user1).proposeReputationUpdate(
          maliciousAgent.address,
          -50,
          "Second report"
        )
      ).to.emit(agentDAO, "ProposalCreatedWithType");
    });
  });
  
  describe("Emergency Functions", function () {
    it("Should allow emergency council to bypass timelock", async function () {
      const { timelock, emergencyCouncil } = await loadFixture(deployDAOFixture);
      
      // This is a conceptual test - in practice, emergency bypass would need
      // a specific operation ID and would be used for critical security issues
      expect(await timelock.emergencyCouncil()).to.equal(emergencyCouncil.address);
    });
  });
  
  describe("Events for Subgraph Indexing", function () {
    it("Should emit comprehensive events for all actions", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      // Test that all major events are emitted with correct parameters
      const tx = await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -100,
        "Performance issues"
      );
      
      await expect(tx)
        .to.emit(agentDAO, "ProposalCreatedWithType")
        .and.to.emit(agentDAO, "ProposalCreated");
    });
  });
  
  describe("Governance Settings Updates", function () {
    it("Should allow proposing governance settings changes", async function () {
      const { agentDAO, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).proposeGovernanceSettingsUpdate(
          "votingDelay",
          2,
          "Increase voting delay for better security"
        )
      ).to.emit(agentDAO, "ProposalCreatedWithType")
       .withArgs(
         1,
         user1.address,
         6, // ProposalType.PARAMETER_UPDATE
         ethers.ZeroAddress,
         anyValue,
         anyValue
       );
    });

    it("Should reject invalid governance settings", async function () {
      const { agentDAO, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).proposeGovernanceSettingsUpdate(
          "invalidSetting",
          100,
          "Invalid setting test"
        )
      ).to.be.revertedWith("Invalid governance setting");
    });

    it("Should execute governance settings update after voting", async function () {
      const { agentDAO, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Create governance settings proposal
      const tx = await agentDAO.connect(user1).proposeGovernanceSettingsUpdate(
        "votingDelay",
        5,
        "Increase voting delay"
      );
      const proposalId = 1;
      
      // Wait for voting delay
      await time.increase(1);
      
      // Vote on proposal
      await agentDAO.connect(user1).castVote(proposalId, 1);
      await agentDAO.connect(user2).castVote(proposalId, 1);
      await agentDAO.connect(user3).castVote(proposalId, 1);
      
      // Wait for voting period
      await time.increase(46028);
      
      const oldDelay = await agentDAO.votingDelay();
      
      // Queue and execute
      const targets = [agentDAO.target];
      const values = [0];
      const calldatas = [
        agentDAO.interface.encodeFunctionData("setVotingDelay", [5])
      ];
      const description = "Update governance setting: votingDelay to 5. Reason: Increase voting delay";
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
      
      await agentDAO.queue(targets, values, calldatas, descriptionHash);
      await time.increase(86401);
      
      await expect(
        agentDAO.execute(targets, values, calldatas, descriptionHash)
      ).to.emit(agentDAO, "GovernanceSettingsUpdated")
       .withArgs("votingDelay", oldDelay, 5, anyValue, anyValue, anyValue);
      
      expect(await agentDAO.votingDelay()).to.equal(5);
    });
  });

  describe("Fallback Voting System", function () {
    it("Should allow fallback voting for users without tokens", async function () {
      const { agentDAO, maliciousAgent, deployer } = await loadFixture(deployDAOFixture);
      
      // Get a fresh account without tokens
      const [, , , , , , newUser] = await ethers.getSigners();
      
      // Create a proposal
      await agentDAO.connect(deployer).proposeReputationUpdate(
        maliciousAgent.address,
        -100,
        "Test fallback voting"
      );
      
      await time.increase(1); // Wait for voting delay
      
      // Check effective voting weight before voting
      const [weight, isFallbackEligible] = await agentDAO.getEffectiveVotingWeight(newUser.address, 1);
      expect(weight).to.equal(1);
      expect(isFallbackEligible).to.be.true;
      
      // Cast vote with fallback mechanism
      await expect(
        agentDAO.connect(newUser).castVote(1, 1)
      ).to.emit(agentDAO, "VoteCastWithFullData")
       .withArgs(newUser.address, 1, 1, 1, "", true, anyValue);
      
      // Check that user has used fallback vote
      expect(await agentDAO.hasUsedFallbackVote(1, newUser.address)).to.be.true;
    });

    it("Should prevent multiple fallback votes from same address", async function () {
      const { agentDAO, maliciousAgent, deployer } = await loadFixture(deployDAOFixture);
      
      const [, , , , , , newUser] = await ethers.getSigners();
      
      await agentDAO.connect(deployer).proposeReputationUpdate(
        maliciousAgent.address,
        -100,
        "Test multiple fallback voting"
      );
      
      await time.increase(1);
      
      // First vote should work
      await agentDAO.connect(newUser).castVote(1, 1);
      
      // Second vote attempt should fail (already voted)
      await expect(
        agentDAO.connect(newUser).castVote(1, 0)
      ).to.be.revertedWith("GovernorVotingSimple: vote already cast");
    });

    it("Should prioritize token voting over fallback", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -100,
        "Test token priority"
      );
      
      await time.increase(1);
      
      const [weight, isFallbackEligible] = await agentDAO.getEffectiveVotingWeight(user1.address, 1);
      expect(weight).to.equal(ethers.parseEther("1000")); // Token weight
      expect(isFallbackEligible).to.be.false;
      
      await expect(
        agentDAO.connect(user1).castVote(1, 1)
      ).to.emit(agentDAO, "VoteCastWithFullData")
       .withArgs(user1.address, 1, 1, ethers.parseEther("1000"), "", false, anyValue);
    });

    it("Should allow disabling fallback voting", async function () {
      const { agentDAO, maliciousAgent, deployer } = await loadFixture(deployDAOFixture);
      
      // Disable fallback voting
      await agentDAO.connect(deployer).setFallbackVoting(false);
      expect(await agentDAO.fallbackVotingEnabled()).to.be.false;
      
      const [, , , , , , newUser] = await ethers.getSigners();
      
      await agentDAO.connect(deployer).proposeReputationUpdate(
        maliciousAgent.address,
        -100,
        "Test disabled fallback"
      );
      
      await time.increase(1);
      
      const [weight, isFallbackEligible] = await agentDAO.getEffectiveVotingWeight(newUser.address, 1);
      expect(weight).to.equal(0);
      expect(isFallbackEligible).to.be.false;
    });
  });

  describe("Enhanced Events for Subgraph", function () {
    it("Should emit ProposalCreatedWithFullData with complete information", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      const tx = await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -200,
        "Comprehensive event test"
      );
      
      await expect(tx)
        .to.emit(agentDAO, "ProposalCreatedWithFullData");
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.topics[0] === agentDAO.interface.getEvent("ProposalCreatedWithFullData").topicHash
      );
      
      expect(event).to.not.be.undefined;
    });

    it("Should emit VoteCastWithFullData with voting details", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -100,
        "Vote event test"
      );
      
      await time.increase(1);
      
      await expect(
        agentDAO.connect(user1).castVoteWithReason(1, 1, "Supporting this proposal")
      ).to.emit(agentDAO, "VoteCastWithFullData")
       .withArgs(
         user1.address,
         1,
         1,
         ethers.parseEther("1000"),
         "Supporting this proposal",
         false,
         anyValue
       );
    });

    it("Should emit GovernanceSettingsUpdated when settings change", async function () {
      const { agentDAO, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Create and execute a governance settings proposal
      await agentDAO.connect(user1).proposeGovernanceSettingsUpdate(
        "votingPeriod",
        50000,
        "Extend voting period"
      );
      
      await time.increase(1);
      
      await agentDAO.connect(user1).castVote(1, 1);
      await agentDAO.connect(user2).castVote(1, 1);
      await agentDAO.connect(user3).castVote(1, 1);
      
      await time.increase(46028);
      
      const targets = [agentDAO.target];
      const values = [0];
      const calldatas = [agentDAO.interface.encodeFunctionData("setVotingPeriod", [50000])];
      const description = "Update governance setting: votingPeriod to 50000. Reason: Extend voting period";
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
      
      await agentDAO.queue(targets, values, calldatas, descriptionHash);
      await time.increase(86401);
      
      await expect(
        agentDAO.execute(targets, values, calldatas, descriptionHash)
      ).to.emit(agentDAO, "GovernanceSettingsUpdated")
       .withArgs("votingPeriod", 46027, 50000, anyValue, anyValue, anyValue);
    });
  });

  describe("Core Governance Functions - Step 2", function () {
    it("Should allow proposing reputation changes with basic function", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).proposeReputationChange(
          maliciousAgent.address,
          -150,
          "Agent performed poorly on recent tasks"
        )
      ).to.emit(agentDAO, "ReputationProposalCreated")
       .withArgs(
         1, // proposalId
         maliciousAgent.address,
         -150,
         "Agent performed poorly on recent tasks"
       );
    });

    it("Should allow proposing reputation changes with evidence", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      const evidence = "Transaction hash: 0x123..., Failed test cases: TestCase1, TestCase2";
      
      await expect(
        agentDAO.connect(user1)["proposeReputationChange(address,int256,string,string)"](
          maliciousAgent.address,
          -200,
          "Agent deleted test cases to hide failures",
          evidence
        )
      ).to.emit(agentDAO, "ReputationProposalWithEvidence")
       .withArgs(
         1,
         maliciousAgent.address,
         -200,
         "Agent deleted test cases to hide failures",
         evidence
       );
    });

    it("Should reject reputation proposals for unregistered agents", async function () {
      const { agentDAO, user1 } = await loadFixture(deployDAOFixture);
      
      const [, , , , , , , unregisteredAgent] = await ethers.getSigners();
      
      await expect(
        agentDAO.connect(user1).proposeReputationChange(
          unregisteredAgent.address,
          -100,
          "Test proposal"
        )
      ).to.be.revertedWith("Agent not registered");
    });

    it("Should require description for reputation proposals", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).proposeReputationChange(
          maliciousAgent.address,
          -100,
          ""
        )
      ).to.be.revertedWith("Description required");
    });

    it("Should require evidence for evidence-based proposals", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1)["proposeReputationChange(address,int256,string,string)"](
          maliciousAgent.address,
          -100,
          "Test description",
          ""
        )
      ).to.be.revertedWith("Evidence required");
    });

    it("Should only allow governance to execute daoUpdateReputation", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).daoUpdateReputation(maliciousAgent.address, -100)
      ).to.be.revertedWith("Only governance can execute");
    });

    it("Should execute daoUpdateReputation through governance proposal", async function () {
      const { agentDAO, agentRegistry, maliciousAgent, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      // Create a proposal using daoUpdateReputation
      const targets = [agentDAO.target];
      const values = [0];
      const calldatas = [
        agentDAO.interface.encodeFunctionData("daoUpdateReputation", [
          maliciousAgent.address,
          -250
        ])
      ];
      const description = "Direct DAO reputation update test";
      
      const proposalId = await agentDAO.connect(user1).propose(targets, values, calldatas, description);
      
      // Wait and vote
      await time.increase(1);
      await agentDAO.connect(user1).castVote(1, 1);
      await agentDAO.connect(user2).castVote(1, 1);
      await agentDAO.connect(user3).castVote(1, 1);
      
      // Execute
      await time.increase(46028);
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
      await agentDAO.queue(targets, values, calldatas, descriptionHash);
      await time.increase(86401);
      
      const oldReputation = await agentRegistry.getAgentReputation(maliciousAgent.address);
      
      await expect(
        agentDAO.execute(targets, values, calldatas, descriptionHash)
      ).to.emit(agentDAO, "DAOReputationUpdate")
       .withArgs(maliciousAgent.address, -250, agentDAO.target, anyValue);
      
      const newReputation = await agentRegistry.getAgentReputation(maliciousAgent.address);
      expect(newReputation).to.equal(oldReputation - 250n);
    });

    it("Should allow updating quorum fraction through governance", async function () {
      const { agentDAO, user1, user2, user3 } = await loadFixture(deployDAOFixture);
      
      const targets = [agentDAO.target];
      const values = [0];
      const calldatas = [
        agentDAO.interface.encodeFunctionData("setQuorumFraction", [8]) // Change to 8%
      ];
      const description = "Update quorum fraction to 8%";
      
      await agentDAO.connect(user1).propose(targets, values, calldatas, description);
      
      await time.increase(1);
      await agentDAO.connect(user1).castVote(1, 1);
      await agentDAO.connect(user2).castVote(1, 1);
      await agentDAO.connect(user3).castVote(1, 1);
      
      await time.increase(46028);
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
      await agentDAO.queue(targets, values, calldatas, descriptionHash);
      await time.increase(86401);
      
      const oldQuorum = await agentDAO.quorumNumerator();
      
      await expect(
        agentDAO.execute(targets, values, calldatas, descriptionHash)
      ).to.emit(agentDAO, "GovernanceSettingsUpdated")
       .withArgs("quorumFraction", oldQuorum, 8, anyValue, anyValue, anyValue);
    });

    it("Should prevent direct quorum updates from non-governance", async function () {
      const { agentDAO, user1 } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).setQuorumFraction(10)
      ).to.be.revertedWith("Only governance can execute");
    });
  });

  describe("Subgraph Integration - Step 2 Events", function () {
    it("Should emit ReputationProposalCreated for subgraph indexing", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      const tx = await agentDAO.connect(user1).proposeReputationChange(
        maliciousAgent.address,
        -100,
        "Performance issues detected"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.topics[0] === agentDAO.interface.getEvent("ReputationProposalCreated").topicHash
      );
      
      expect(event).to.not.be.undefined;
    });

    it("Should emit ReputationProposalWithEvidence for dispute tracking", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      const evidence = "Logs: Failed 5/10 tasks, Response time: >30s, Error rate: 50%";
      
      const tx = await agentDAO.connect(user1)["proposeReputationChange(address,int256,string,string)"](
        maliciousAgent.address,
        -300,
        "Malicious behavior - Task manipulation",
        evidence
      );
      
      await expect(tx)
        .to.emit(agentDAO, "ReputationProposalWithEvidence")
        .withArgs(1, maliciousAgent.address, -300, "Malicious behavior - Task manipulation", evidence);
    });
  });

  describe("View Functions", function () {
    it("Should return correct proposal data", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      await agentDAO.connect(user1).proposeReputationUpdate(
        maliciousAgent.address,
        -100,
        "Test reason"
      );
      
      const proposalData = await agentDAO.getProposalData(1);
      expect(proposalData.proposalId).to.equal(1);
      expect(proposalData.targetAgent).to.equal(maliciousAgent.address);
      expect(proposalData.reputationDelta).to.equal(-100);
      expect(proposalData.reason).to.equal("Test reason");
      expect(proposalData.proposer).to.equal(user1.address);
    });
  });

  describe("Hedera EVM & Agent Integration - Step 3", function () {
    it("Should allow registered agents to submit proposals", async function () {
      const { agentDAO, agentRegistry, user1, user2, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const targets = [agentRegistry.target];
      const values = [0];
      const calldatas = [
        agentRegistry.interface.encodeFunctionData("updateReputation", [maliciousAgent.address, -100])
      ];
      const description = "Automated reputation update from Hedera EVM agent";
      
      await expect(
        agentDAO.connect(user1).submitProposalFromAgent(targets, values, calldatas, description)
      ).to.emit(agentDAO, "AgentProposalSubmitted")
       .withArgs(1, user1.address, "hedera_evm", description, anyValue);
    });

    it("Should allow simplified reputation proposals from agents", async function () {
      const { agentDAO, user1, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).submitReputationProposalFromAgent(
          maliciousAgent.address,
          -50,
          "Automated reputation adjustment"
        )
      ).to.emit(agentDAO, "AgentProposalSubmitted")
       .withArgs(1, user1.address, "hedera_evm", "Automated reputation adjustment", anyValue)
       .and.to.emit(agentDAO, "ReputationProposalCreated")
       .withArgs(1, maliciousAgent.address, -50, "Automated reputation adjustment");
    });

    it("Should reject proposals from unregistered agents", async function () {
      const { agentDAO, user3 } = await loadFixture(deployDAOFixture);
      
      const [, , , , , , , unregisteredAgent] = await ethers.getSigners();
      
      await expect(
        agentDAO.connect(unregisteredAgent).submitReputationProposalFromAgent(
          user3.address,
          -100,
          "Test proposal"
        )
      ).to.be.revertedWith("Caller not registered agent");
    });

    it("Should enforce agent proposal rate limiting", async function () {
      const { agentDAO, agentRegistry, user1, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      // Submit maximum allowed proposals
      for (let i = 0; i < 10; i++) {
        await agentDAO.connect(user1).submitReputationProposalFromAgent(
          maliciousAgent.address,
          -1,
          `Proposal ${i + 1}`
        );
      }
      
      // 11th proposal should fail
      await expect(
        agentDAO.connect(user1).submitReputationProposalFromAgent(
          maliciousAgent.address,
          -1,
          "Proposal 11"
        )
      ).to.be.revertedWith("Daily agent proposal limit exceeded");
    });

    it("Should reset agent proposal count daily", async function () {
      const { agentDAO, maliciousAgent, user1 } = await loadFixture(deployDAOFixture);
      
      // Submit a proposal
      await agentDAO.connect(user1).submitReputationProposalFromAgent(
        maliciousAgent.address,
        -1,
        "First proposal"
      );
      
      // Fast forward to next day
      await time.increase(86400); // 24 hours
      
      // Should be able to submit again
      await expect(
        agentDAO.connect(user1).submitReputationProposalFromAgent(
          maliciousAgent.address,
          -1,
          "Next day proposal"
        )
      ).to.emit(agentDAO, "AgentProposalSubmitted");
    });

    it("Should handle cross-chain triggers from authorized reporters", async function () {
      const { agentDAO, agentRegistry, emergencyCouncil, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const triggerHash = ethers.keccak256(ethers.toUtf8Bytes("unique-trigger-123"));
      const sourceChain = ethers.Wallet.createRandom().address;
      const triggerType = "ccip_reputation_update";
      
      const targets = [agentRegistry.target];
      const values = [0];
      const calldatas = [
        agentRegistry.interface.encodeFunctionData("updateReputation", [maliciousAgent.address, -200])
      ];
      const description = "Cross-chain reputation update via CCIP";
      
      const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes[]", "string"],
        [targets, values, calldatas, description]
      );
      
      await expect(
        agentDAO.connect(emergencyCouncil).processCrossChainTrigger(
          sourceChain,
          triggerHash,
          triggerType,
          proposalData
        )
      ).to.emit(agentDAO, "CrossChainProposalTrigger")
       .withArgs(1, sourceChain, triggerHash, triggerType, proposalData, anyValue);
    });

    it("Should prevent replay attacks on cross-chain triggers", async function () {
      const { agentDAO, agentRegistry, emergencyCouncil, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const triggerHash = ethers.keccak256(ethers.toUtf8Bytes("unique-trigger-456"));
      const sourceChain = ethers.Wallet.createRandom().address;
      const triggerType = "ccip_reputation_update";
      
      const targets = [agentRegistry.target];
      const values = [0];
      const calldatas = [
        agentRegistry.interface.encodeFunctionData("updateReputation", [maliciousAgent.address, -200])
      ];
      const description = "Cross-chain reputation update via CCIP";
      
      const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes[]", "string"],
        [targets, values, calldatas, description]
      );
      
      // First call should succeed
      await agentDAO.connect(emergencyCouncil).processCrossChainTrigger(
        sourceChain,
        triggerHash,
        triggerType,
        proposalData
      );
      
      // Second call with same trigger hash should fail
      await expect(
        agentDAO.connect(emergencyCouncil).processCrossChainTrigger(
          sourceChain,
          triggerHash,
          triggerType,
          proposalData
        )
      ).to.be.revertedWith("Trigger already processed");
    });

    it("Should handle Chainlink Functions triggers", async function () {
      const { agentDAO, emergencyCouncil, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const requestId = ethers.keccak256(ethers.toUtf8Bytes("chainlink-request-123"));
      const functionName = "getAgentPerformanceScore";
      const requestData = ethers.toUtf8Bytes("performance check for agent");
      
      const responseData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "int256", "string"],
        [maliciousAgent.address, -150, "Poor performance detected by oracle"]
      );
      
      await expect(
        agentDAO.connect(emergencyCouncil).processChainlinkFunctionsTrigger(
          requestId,
          functionName,
          requestData,
          responseData
        )
      ).to.emit(agentDAO, "ChainlinkFunctionsTrigger")
       .withArgs(1, requestId, functionName, requestData, responseData, anyValue);
    });

    it("Should prevent duplicate Chainlink Functions processing", async function () {
      const { agentDAO, emergencyCouncil, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const requestId = ethers.keccak256(ethers.toUtf8Bytes("chainlink-request-456"));
      const functionName = "getAgentPerformanceScore";
      const requestData = ethers.toUtf8Bytes("performance check for agent");
      
      const responseData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "int256", "string"],
        [maliciousAgent.address, -150, "Poor performance detected by oracle"]
      );
      
      // First call should succeed
      await agentDAO.connect(emergencyCouncil).processChainlinkFunctionsTrigger(
        requestId,
        functionName,
        requestData,
        responseData
      );
      
      // Second call with same request ID should fail
      await expect(
        agentDAO.connect(emergencyCouncil).processChainlinkFunctionsTrigger(
          requestId,
          functionName,
          requestData,
          responseData
        )
      ).to.be.revertedWith("Request already processed");
    });

    it("Should emit HederaEVMAgentInteraction events", async function () {
      const { agentDAO, user1, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(user1).submitReputationProposalFromAgent(
          maliciousAgent.address,
          -25,
          "Test interaction event"
        )
      ).to.emit(agentDAO, "HederaEVMAgentInteraction")
       .withArgs(user1.address, "submit_proposal", anyValue, anyValue);
    });

    it("Should allow disabling agent proposals", async function () {
      const { agentDAO, deployer, user1, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      // Disable agent proposals
      await agentDAO.connect(deployer).setAgentProposalsEnabled(false);
      
      await expect(
        agentDAO.connect(user1).submitReputationProposalFromAgent(
          maliciousAgent.address,
          -100,
          "Should fail"
        )
      ).to.be.revertedWith("Agent proposals disabled");
    });

    it("Should allow updating agent proposal limits", async function () {
      const { agentDAO, deployer } = await loadFixture(deployDAOFixture);
      
      await expect(
        agentDAO.connect(deployer).setMaxAgentProposalsPerDay(20)
      ).to.emit(agentDAO, "ParameterUpdated")
       .withArgs("maxAgentProposalsPerDay", 10, 20, 0);
      
      expect(await agentDAO.maxAgentProposalsPerDay()).to.equal(20);
    });

    it("Should allow whitelisting agents", async function () {
      const { agentDAO, deployer } = await loadFixture(deployDAOFixture);
      
      const [, , , , , , , whitelistAgent] = await ethers.getSigners();
      
      await expect(
        agentDAO.connect(deployer).setAgentWhitelist(whitelistAgent.address, true)
      ).to.emit(agentDAO, "HederaEVMAgentInteraction")
       .withArgs(whitelistAgent.address, "whitelist_added", anyValue, anyValue);
      
      expect(await agentDAO.isAgentWhitelisted(whitelistAgent.address)).to.be.true;
    });

    it("Should allow resetting agent proposal counts", async function () {
      const { agentDAO, deployer, user1, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      // Submit some proposals
      await agentDAO.connect(user1).submitReputationProposalFromAgent(
        maliciousAgent.address,
        -1,
        "Test proposal"
      );
      
      // Reset count
      await expect(
        agentDAO.connect(deployer).resetAgentProposalCount(user1.address)
      ).to.emit(agentDAO, "HederaEVMAgentInteraction")
       .withArgs(user1.address, "proposal_count_reset", anyValue, anyValue);
    });
  });

  describe("Step 3 View Functions", function () {
    it("Should return correct agent proposal stats", async function () {
      const { agentDAO, user1, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const stats = await agentDAO.getAgentProposalStats(user1.address);
      
      expect(stats.canPropose).to.be.true;
      expect(stats.remainingProposals).to.equal(10);
      expect(stats.totalProposalsToday).to.equal(0);
      expect(stats.dailyLimit).to.equal(10);
      expect(stats.isRegistered).to.be.true;
      expect(stats.isWhitelisted).to.be.false;
    });

    it("Should check agent whitelist status", async function () {
      const { agentDAO, deployer, user1 } = await loadFixture(deployDAOFixture);
      
      expect(await agentDAO.isAgentWhitelisted(user1.address)).to.be.false;
      
      await agentDAO.connect(deployer).setAgentWhitelist(user1.address, true);
      
      expect(await agentDAO.isAgentWhitelisted(user1.address)).to.be.true;
    });

    it("Should track remaining proposals correctly", async function () {
      const { agentDAO, user1, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      expect(await agentDAO.getAgentRemainingProposals(user1.address)).to.equal(10);
      
      // Submit one proposal
      await agentDAO.connect(user1).submitReputationProposalFromAgent(
        maliciousAgent.address,
        -1,
        "Test proposal"
      );
      
      expect(await agentDAO.getAgentRemainingProposals(user1.address)).to.equal(9);
    });

    it("Should check cross-chain trigger processing status", async function () {
      const { agentDAO, agentRegistry, emergencyCouncil, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const triggerHash = ethers.keccak256(ethers.toUtf8Bytes("test-trigger"));
      
      expect(await agentDAO.isCrossChainTriggerProcessed(triggerHash)).to.be.false;
      
      const targets = [agentRegistry.target];
      const values = [0];
      const calldatas = [
        agentRegistry.interface.encodeFunctionData("updateReputation", [maliciousAgent.address, -100])
      ];
      const description = "Test cross-chain trigger";
      
      const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "uint256[]", "bytes[]", "string"],
        [targets, values, calldatas, description]
      );
      
      await agentDAO.connect(emergencyCouncil).processCrossChainTrigger(
        ethers.Wallet.createRandom().address,
        triggerHash,
        "test_trigger",
        proposalData
      );
      
      expect(await agentDAO.isCrossChainTriggerProcessed(triggerHash)).to.be.true;
    });

    it("Should map Chainlink requests to proposals", async function () {
      const { agentDAO, emergencyCouncil, maliciousAgent } = await loadFixture(deployDAOFixture);
      
      const requestId = ethers.keccak256(ethers.toUtf8Bytes("test-request"));
      
      expect(await agentDAO.getProposalForChainlinkRequest(requestId)).to.equal(0);
      
      const responseData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "int256", "string"],
        [maliciousAgent.address, -100, "Test response"]
      );
      
      await agentDAO.connect(emergencyCouncil).processChainlinkFunctionsTrigger(
        requestId,
        "testFunction",
        ethers.toUtf8Bytes("test request"),
        responseData
      );
      
      expect(await agentDAO.getProposalForChainlinkRequest(requestId)).to.equal(1);
    });
  });
  
  // Helper function for tests
  const anyValue = () => true;
});
