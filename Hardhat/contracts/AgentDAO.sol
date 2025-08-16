// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AgentDAO
 * @dev DAO governance contract for managing AI agent reputation and disputes in RelAI system
 * @notice This contract enables decentralized governance for reputation management across chains
 */

interface IAgentRegistry {
    function updateReputation(address agent, int256 delta) external;
    function reportMalicious(address agent, string calldata evidence) external;
    function getAgentReputation(address agent) external view returns (int256);
    function isAgentRegistered(address agent) external view returns (bool);
    function slashReputation(address agent, uint256 amount) external;
    function blacklistAgent(address agent, bool blacklisted) external;
    
    // Step 3: Additional functions for agent verification
    function isRegistered(address agent) external view returns (bool);
    function getAgentType(address agent) external view returns (string memory);
    function isAgentWhitelisted(address agent) external view returns (bool);
}

contract AgentDAO is 
    Governor, 
    GovernorSettings, 
    GovernorVotes, 
    GovernorVotesQuorumFraction, 
    GovernorTimelockControl,
    Ownable 
{
    // Registry contract interface
    IAgentRegistry public immutable registry;
    
    // Fallback voting system (1-vote-per-address when no tokens)
    bool public fallbackVotingEnabled = true;
    mapping(uint256 => mapping(address => bool)) public hasVotedInProposal;
    uint256 public currentProposalId;
    
    // Proposal types for different governance actions
    enum ProposalType {
        REPUTATION_UPDATE,     // Update agent reputation
        MALICIOUS_REPORT,      // Report and penalize malicious behavior
        REPUTATION_SLASH,      // Slash reputation tokens/stake
        BLACKLIST_AGENT,       // Blacklist agent across chains
        CROSS_CHAIN_SYNC,      // Sync reputation across chains
        PARAMETER_UPDATE,      // Update DAO parameters
        EMERGENCY_ACTION       // Emergency governance actions
    }
    
    // Proposal data structure
    struct ProposalData {
        uint256 proposalId;
        ProposalType proposalType;
        address targetAgent;
        int256 reputationDelta;
        string evidence;
        string reason;
        bool executed;
        uint256 timestamp;
        address proposer;
    }
    
    // Events for The Graph subgraph indexing
    event ProposalCreatedWithType(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType indexed proposalType,
        address targetAgent,
        string description,
        uint256 timestamp
    );
    
    event ProposalExecutedWithDetails(
        uint256 indexed proposalId,
        ProposalType indexed proposalType,
        address indexed targetAgent,
        int256 reputationDelta,
        bool success,
        uint256 timestamp
    );
    
    event ReputationUpdated(
        address indexed agent,
        int256 oldReputation,
        int256 newReputation,
        int256 delta,
        uint256 indexed proposalId,
        string reason
    );
    
    event AgentReported(
        address indexed agent,
        address indexed reporter,
        string evidence,
        uint256 indexed proposalId,
        uint256 timestamp
    );
    
    event AgentBlacklisted(
        address indexed agent,
        bool blacklisted,
        uint256 indexed proposalId,
        string reason,
        uint256 timestamp
    );
    
    event CrossChainSyncRequested(
        address indexed agent,
        int256 reputation,
        uint256 indexed proposalId,
        uint256 timestamp
    );
    
    event EmergencyActionTaken(
        uint256 indexed proposalId,
        address indexed executor,
        string action,
        uint256 timestamp
    );
    
    event ParameterUpdated(
        string indexed parameter,
        uint256 oldValue,
        uint256 newValue,
        uint256 indexed proposalId
    );
    
    // Enhanced events with full proposal data for subgraph indexing
    event ProposalCreatedWithFullData(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType indexed proposalType,
        address targetAgent,
        int256 reputationDelta,
        string evidence,
        string reason,
        string description,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        uint256 timestamp
    );
    
    event VoteCastWithFullData(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason,
        bool isFallbackVote,
        uint256 timestamp
    );
    
    event GovernanceSettingsUpdated(
        string indexed setting,
        uint256 oldValue,
        uint256 newValue,
        uint256 indexed proposalId,
        address updatedBy,
        uint256 timestamp
    );
    
    // Core governance events for Step 2
    event ReputationProposalCreated(
        uint256 indexed proposalId, 
        address indexed agent, 
        int256 delta, 
        string description
    );
    
    event ReputationProposalWithEvidence(
        uint256 indexed proposalId,
        address indexed agent,
        int256 delta,
        string description,
        string evidence
    );
    
    event DAOReputationUpdate(
        address indexed agent,
        int256 delta,
        address indexed executor,
        uint256 timestamp
    );
    
    // Step 3: Events for Hedera EVM and cross-chain integration
    event AgentProposalSubmitted(
        uint256 indexed proposalId,
        address indexed agent,
        string agentType,
        string description,
        uint256 timestamp
    );
    
    event CrossChainProposalTrigger(
        uint256 indexed proposalId,
        address indexed sourceChain,
        bytes32 indexed triggerHash,
        string triggerType,
        bytes triggerData,
        uint256 timestamp
    );
    
    event ChainlinkFunctionsTrigger(
        uint256 indexed proposalId,
        bytes32 indexed requestId,
        string functionName,
        bytes requestData,
        bytes responseData,
        uint256 timestamp
    );
    
    event HederaEVMAgentInteraction(
        address indexed agent,
        string indexed action,
        bytes data,
        uint256 timestamp
    );
    
    // Mappings
    mapping(uint256 => ProposalData) public proposalData;
    mapping(address => uint256) public lastProposalTime;
    mapping(address => bool) public authorizedReporters;
    
    // DAO Parameters
    uint256 public minProposalInterval = 1 hours;
    uint256 public reputationSlashLimit = 1000; // Maximum reputation that can be slashed in one proposal
    uint256 public emergencyQuorumFraction = 10; // 10% for emergency proposals
    
    // Step 3: Hedera EVM and cross-chain parameters
    mapping(address => bool) public whitelistedAgents; // Additional whitelist for agent proposals
    mapping(bytes32 => bool) public processedCrossChainTriggers; // Prevent replay attacks
    mapping(bytes32 => uint256) public chainlinkRequestToProposal; // Map Chainlink requests to proposals
    bool public agentProposalsEnabled = true; // Toggle for agent proposal functionality
    uint256 public maxAgentProposalsPerDay = 10; // Rate limiting for agents
    mapping(address => uint256) public agentProposalCount; // Daily proposal count per agent
    mapping(address => uint256) public agentLastProposalDay; // Track daily reset
    
    // Governor voting system
    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }
    mapping(uint256 => ProposalVote) private _proposalVotes;
    
    // Modifiers
    modifier onlyAuthorizedReporter() {
        require(authorizedReporters[msg.sender], "Not authorized reporter");
        _;
    }
    
    modifier rateLimited() {
        require(
            block.timestamp >= lastProposalTime[msg.sender] + minProposalInterval,
            "Proposal rate limited"
        );
        lastProposalTime[msg.sender] = block.timestamp;
        _;
    }
    
    modifier onlyDAOGovernance() {
        require(msg.sender == address(this), "Only DAO governance can execute");
        _;
    }
    
    // Step 3: Modifiers for agent interactions
    modifier onlyRegisteredAgent() {
        require(registry.isRegistered(msg.sender), "Caller not registered agent");
        _;
    }
    
    modifier onlyWhitelistedAgent() {
        require(
            registry.isRegistered(msg.sender) || whitelistedAgents[msg.sender],
            "Agent not registered or whitelisted"
        );
        _;
    }
    
    modifier agentRateLimited() {
        require(agentProposalsEnabled, "Agent proposals disabled");
        
        uint256 currentDay = block.timestamp / 1 days;
        
        // Reset daily count if it's a new day
        if (agentLastProposalDay[msg.sender] < currentDay) {
            agentProposalCount[msg.sender] = 0;
            agentLastProposalDay[msg.sender] = currentDay;
        }
        
        require(
            agentProposalCount[msg.sender] < maxAgentProposalsPerDay,
            "Daily agent proposal limit exceeded"
        );
        
        agentProposalCount[msg.sender]++;
        _;
    }

    constructor(
        IVotes _token,
        address _registry,
        TimelockController _timelock
    )
        Governor("AgentDAO")
        GovernorSettings(
            1,      // voting delay (1 block)
            46027,  // voting period (~7 days at 13.2s per block)
            0       // proposal threshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(_timelock)
        Ownable(msg.sender)
    {
        registry = IAgentRegistry(_registry);
        
        // Auto-authorize contract deployer as initial reporter
        authorizedReporters[msg.sender] = true;
    }
    
    // ==================== CORE GOVERNANCE FUNCTIONS - STEP 2 ====================
    
    /**
     * @dev Core function to propose reputation changes
     * @param agent Address of the agent whose reputation should be changed
     * @param delta Reputation change (positive or negative)
     * @param description Description of the proposal
     */
    function proposeReputationChange(
        address agent, 
        int256 delta, 
        string memory description
    ) external returns (uint256) {
        require(registry.isAgentRegistered(agent), "Agent not registered");
        require(bytes(description).length > 0, "Description required");
        
        address[] memory targets = new address[](1);
        targets[0] = address(registry);

        uint256[] memory values = new uint256[](1);
        values[0] = 0; // No ETH value

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(IAgentRegistry.updateReputation.selector, agent, delta);

        uint256 proposalId = propose(targets, values, calldatas, description);
        
        emit ReputationProposalCreated(proposalId, agent, delta, description);
        
        return proposalId;
    }
    
    /**
     * @dev Enhanced reputation change proposal with evidence for disputes/malice
     * @param agent Address of the agent whose reputation should be changed
     * @param delta Reputation change (positive or negative)
     * @param description Description of the proposal
     * @param evidence Evidence supporting the reputation change (for disputes/malicious behavior)
     */
    function proposeReputationChange(
        address agent,
        int256 delta,
        string memory description,
        string calldata evidence
    ) external returns (uint256) {
        require(registry.isAgentRegistered(agent), "Agent not registered");
        require(bytes(description).length > 0, "Description required");
        require(bytes(evidence).length > 0, "Evidence required");
        
        address[] memory targets = new address[](1);
        targets[0] = address(registry);

        uint256[] memory values = new uint256[](1);
        values[0] = 0; // No ETH value

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(IAgentRegistry.updateReputation.selector, agent, delta);

        uint256 proposalId = propose(targets, values, calldatas, description);
        
        emit ReputationProposalWithEvidence(proposalId, agent, delta, description, evidence);
        
        return proposalId;
    }
    
    /**
     * @dev DAO-executable function to update reputation (called by successful proposals)
     * @param agent Address of the agent
     * @param delta Reputation change amount
     */
    function daoUpdateReputation(address agent, int256 delta) external onlyDAOGovernance {
        registry.updateReputation(agent, delta);
        
        emit DAOReputationUpdate(agent, delta, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Experiment: Allow changing quorum via proposal
     * @param newQuorum New quorum fraction (percentage)
     */
    function setQuorumFraction(uint256 newQuorum) external onlyDAOGovernance {
        uint256 oldQuorum = quorumNumerator();
        _updateQuorumNumerator(newQuorum);
        
        emit GovernanceSettingsUpdated(
            "quorumFraction",
            oldQuorum,
            newQuorum,
            currentProposalId,
            msg.sender,
            block.timestamp
        );
    }
    
    // ==================== END CORE GOVERNANCE FUNCTIONS ====================
    
    // ==================== HEDERA EVM & AGENT INTEGRATION - STEP 3 ====================
    
    /**
     * @dev Core function for agents to submit proposals programmatically
     * @param targets Array of target addresses for the proposal
     * @param values Array of ETH values for the proposal calls
     * @param calldatas Array of function call data
     * @param description Description of the proposal
     */
    function submitProposalFromAgent(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external onlyRegisteredAgent agentRateLimited returns (uint256) {
        require(bytes(description).length > 0, "Description required");
        require(targets.length > 0, "No targets provided");
        require(targets.length == values.length && targets.length == calldatas.length, "Array length mismatch");
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        // Get agent type for event emission
        string memory agentType = "";
        try registry.getAgentType(msg.sender) returns (string memory aType) {
            agentType = aType;
        } catch {
            agentType = "unknown";
        }
        
        emit AgentProposalSubmitted(
            proposalId,
            msg.sender,
            agentType,
            description,
            block.timestamp
        );
        
        emit HederaEVMAgentInteraction(
            msg.sender,
            "submit_proposal",
            abi.encode(proposalId, targets, values, calldatas),
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @dev Alternative agent proposal function with simplified interface for common use cases
     * @param agent Target agent for reputation change
     * @param delta Reputation delta
     * @param description Proposal description
     */
    function submitReputationProposalFromAgent(
        address agent,
        int256 delta,
        string memory description
    ) external onlyRegisteredAgent agentRateLimited returns (uint256) {
        require(registry.isAgentRegistered(agent), "Target agent not registered");
        require(bytes(description).length > 0, "Description required");
        
        address[] memory targets = new address[](1);
        targets[0] = address(registry);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            IAgentRegistry.updateReputation.selector,
            agent,
            delta
        );
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        string memory agentType = "";
        try registry.getAgentType(msg.sender) returns (string memory aType) {
            agentType = aType;
        } catch {
            agentType = "unknown";
        }
        
        emit AgentProposalSubmitted(
            proposalId,
            msg.sender,
            agentType,
            description,
            block.timestamp
        );
        
        emit ReputationProposalCreated(proposalId, agent, delta, description);
        
        return proposalId;
    }
    
    /**
     * @dev Handle cross-chain proposal triggers (e.g., from Chainlink CCIP)
     * @param sourceChain Address/identifier of source chain
     * @param triggerHash Unique hash to prevent replay
     * @param triggerType Type of cross-chain trigger
     * @param encodedProposalData Encoded proposal data
     */
    function processCrossChainTrigger(
        address sourceChain,
        bytes32 triggerHash,
        string memory triggerType,
        bytes memory encodedProposalData
    ) external onlyAuthorizedReporter returns (uint256) {
        require(!processedCrossChainTriggers[triggerHash], "Trigger already processed");
        require(bytes(triggerType).length > 0, "Trigger type required");
        
        processedCrossChainTriggers[triggerHash] = true;
        
        // Decode proposal data
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description
        ) = abi.decode(encodedProposalData, (address[], uint256[], bytes[], string));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        emit CrossChainProposalTrigger(
            proposalId,
            sourceChain,
            triggerHash,
            triggerType,
            encodedProposalData,
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @dev Handle Chainlink Functions responses that trigger proposals
     * @param requestId Chainlink request ID
     * @param functionName Name of the function that was called
     * @param requestData Original request data
     * @param responseData Response from Chainlink Functions
     */
    function processChainlinkFunctionsTrigger(
        bytes32 requestId,
        string memory functionName,
        bytes memory requestData,
        bytes memory responseData
    ) external onlyAuthorizedReporter returns (uint256) {
        require(chainlinkRequestToProposal[requestId] == 0, "Request already processed");
        require(bytes(functionName).length > 0, "Function name required");
        
        // Decode response to determine proposal action
        // This is a simplified example - in practice, you'd have more sophisticated logic
        (
            address targetAgent,
            int256 reputationDelta,
            string memory evidence
        ) = abi.decode(responseData, (address, int256, string));
        
        // Create proposal based on Chainlink Functions response
        address[] memory targets = new address[](1);
        targets[0] = address(registry);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            IAgentRegistry.updateReputation.selector,
            targetAgent,
            reputationDelta
        );
        
        string memory description = string(abi.encodePacked(
            "Chainlink Functions triggered reputation update: ",
            functionName,
            " - ",
            evidence
        ));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        chainlinkRequestToProposal[requestId] = proposalId;
        
        emit ChainlinkFunctionsTrigger(
            proposalId,
            requestId,
            functionName,
            requestData,
            responseData,
            block.timestamp
        );
        
        return proposalId;
    }
    
    // ==================== END HEDERA EVM & AGENT INTEGRATION ====================
    
    /**
     * @dev Create a proposal to update an agent's reputation
     * @param agent Address of the agent
     * @param delta Reputation change (positive or negative)
     * @param reason Explanation for the reputation change
     */
    function proposeReputationUpdate(
        address agent,
        int256 delta,
        string memory reason
    ) external rateLimited returns (uint256) {
        require(registry.isAgentRegistered(agent), "Agent not registered");
        require(bytes(reason).length > 0, "Reason required");
        
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(registry);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            IAgentRegistry.updateReputation.selector,
            agent,
            delta
        );
        
        string memory description = string(abi.encodePacked(
            "Update reputation for agent ",
            Strings.toHexString(agent),
            " by ",
            Strings.toString(uint256(delta)),
            ". Reason: ",
            reason
        ));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        proposalData[proposalId] = ProposalData({
            proposalId: proposalId,
            proposalType: ProposalType.REPUTATION_UPDATE,
            targetAgent: agent,
            reputationDelta: delta,
            evidence: "",
            reason: reason,
            executed: false,
            timestamp: block.timestamp,
            proposer: msg.sender
        });
        
        emit ProposalCreatedWithType(
            proposalId,
            msg.sender,
            ProposalType.REPUTATION_UPDATE,
            agent,
            description,
            block.timestamp
        );
        
        // Emit enhanced event with full data for subgraph
        string[] memory signatures = new string[](1);
        signatures[0] = "updateReputation(address,int256)";
        
        emit ProposalCreatedWithFullData(
            proposalId,
            msg.sender,
            ProposalType.REPUTATION_UPDATE,
            agent,
            delta,
            "",
            reason,
            description,
            targets,
            values,
            signatures,
            calldatas,
            block.number + votingDelay(),
            block.number + votingDelay() + votingPeriod(),
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @dev Report a malicious agent and propose reputation slash
     * @param agent Address of the malicious agent
     * @param evidence Evidence of malicious behavior
     * @param slashAmount Amount to slash from reputation
     */
    function reportMaliciousAgent(
        address agent,
        string memory evidence,
        uint256 slashAmount
    ) external onlyAuthorizedReporter rateLimited returns (uint256) {
        require(registry.isAgentRegistered(agent), "Agent not registered");
        require(bytes(evidence).length > 0, "Evidence required");
        require(slashAmount <= reputationSlashLimit, "Slash amount too high");
        
        address[] memory targets = new address[](2);
        uint256[] memory values = new uint256[](2);
        bytes[] memory calldatas = new bytes[](2);
        
        // Report malicious behavior
        targets[0] = address(registry);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            IAgentRegistry.reportMalicious.selector,
            agent,
            evidence
        );
        
        // Slash reputation
        targets[1] = address(registry);
        values[1] = 0;
        calldatas[1] = abi.encodeWithSelector(
            IAgentRegistry.slashReputation.selector,
            agent,
            slashAmount
        );
        
        string memory description = string(abi.encodePacked(
            "Report malicious agent ",
            Strings.toHexString(agent),
            " and slash reputation by ",
            Strings.toString(slashAmount),
            ". Evidence: ",
            evidence
        ));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        proposalData[proposalId] = ProposalData({
            proposalId: proposalId,
            proposalType: ProposalType.MALICIOUS_REPORT,
            targetAgent: agent,
            reputationDelta: -int256(slashAmount),
            evidence: evidence,
            reason: "Malicious behavior reported",
            executed: false,
            timestamp: block.timestamp,
            proposer: msg.sender
        });
        
        emit ProposalCreatedWithType(
            proposalId,
            msg.sender,
            ProposalType.MALICIOUS_REPORT,
            agent,
            description,
            block.timestamp
        );
        
        emit AgentReported(agent, msg.sender, evidence, proposalId, block.timestamp);
        
        return proposalId;
    }
    
    /**
     * @dev Propose to blacklist an agent across all chains
     * @param agent Address of the agent to blacklist
     * @param blacklisted Whether to blacklist or unblacklist
     * @param reason Reason for blacklisting
     */
    function proposeBlacklistAgent(
        address agent,
        bool blacklisted,
        string memory reason
    ) external rateLimited returns (uint256) {
        require(registry.isAgentRegistered(agent), "Agent not registered");
        require(bytes(reason).length > 0, "Reason required");
        
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(registry);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            IAgentRegistry.blacklistAgent.selector,
            agent,
            blacklisted
        );
        
        string memory description = string(abi.encodePacked(
            blacklisted ? "Blacklist" : "Unblacklist",
            " agent ",
            Strings.toHexString(agent),
            ". Reason: ",
            reason
        ));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        proposalData[proposalId] = ProposalData({
            proposalId: proposalId,
            proposalType: ProposalType.BLACKLIST_AGENT,
            targetAgent: agent,
            reputationDelta: 0,
            evidence: "",
            reason: reason,
            executed: false,
            timestamp: block.timestamp,
            proposer: msg.sender
        });
        
        emit ProposalCreatedWithType(
            proposalId,
            msg.sender,
            ProposalType.BLACKLIST_AGENT,
            agent,
            description,
            block.timestamp
        );
        
        return proposalId;
    }
    
    // Administrative functions
    
    /**
     * @dev Authorize or revoke reporter status
     * @param reporter Address to authorize/revoke
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedReporter(address reporter, bool authorized) external onlyOwner {
        authorizedReporters[reporter] = authorized;
        emit ParameterUpdated(
            "authorizedReporter",
            authorized ? 0 : 1,
            authorized ? 1 : 0,
            0
        );
    }
    
    /**
     * @dev Update DAO parameters
     */
    function updateMinProposalInterval(uint256 newInterval) external onlyOwner {
        uint256 oldInterval = minProposalInterval;
        minProposalInterval = newInterval;
        emit ParameterUpdated("minProposalInterval", oldInterval, newInterval, 0);
    }
    
    function updateReputationSlashLimit(uint256 newLimit) external onlyOwner {
        uint256 oldLimit = reputationSlashLimit;
        reputationSlashLimit = newLimit;
        emit ParameterUpdated("reputationSlashLimit", oldLimit, newLimit, 0);
    }
    
    /**
     * @dev Governance functions to update settings through proposals
     */
    function proposeGovernanceSettingsUpdate(
        string memory setting,
        uint256 newValue,
        string memory reason
    ) external rateLimited returns (uint256) {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(this);
        values[0] = 0;
        
        // Determine which setting to update
        if (keccak256(bytes(setting)) == keccak256(bytes("votingDelay"))) {
            calldatas[0] = abi.encodeWithSignature("setVotingDelay(uint256)", newValue);
        } else if (keccak256(bytes(setting)) == keccak256(bytes("votingPeriod"))) {
            calldatas[0] = abi.encodeWithSignature("setVotingPeriod(uint256)", newValue);
        } else if (keccak256(bytes(setting)) == keccak256(bytes("proposalThreshold"))) {
            calldatas[0] = abi.encodeWithSignature("setProposalThreshold(uint256)", newValue);
        } else if (keccak256(bytes(setting)) == keccak256(bytes("quorumFraction"))) {
            calldatas[0] = abi.encodeWithSignature("updateQuorumNumerator(uint256)", newValue);
        } else {
            revert("Invalid governance setting");
        }
        
        string memory description = string(abi.encodePacked(
            "Update governance setting: ",
            setting,
            " to ",
            Strings.toString(newValue),
            ". Reason: ",
            reason
        ));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        proposalData[proposalId] = ProposalData({
            proposalId: proposalId,
            proposalType: ProposalType.PARAMETER_UPDATE,
            targetAgent: address(0),
            reputationDelta: 0,
            evidence: "",
            reason: reason,
            executed: false,
            timestamp: block.timestamp,
            proposer: msg.sender
        });
        
        emit ProposalCreatedWithType(
            proposalId,
            msg.sender,
            ProposalType.PARAMETER_UPDATE,
            address(0),
            description,
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @dev Update voting delay through governance
     */
    function setVotingDelay(uint256 newVotingDelay) external {
        require(msg.sender == address(this), "Only governance can call");
        uint256 oldDelay = votingDelay();
        _setVotingDelay(uint48(newVotingDelay));
        
        emit GovernanceSettingsUpdated(
            "votingDelay",
            oldDelay,
            newVotingDelay,
            currentProposalId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Update voting period through governance
     */
    function setVotingPeriod(uint256 newVotingPeriod) external {
        require(msg.sender == address(this), "Only governance can call");
        uint256 oldPeriod = votingPeriod();
        _setVotingPeriod(uint32(newVotingPeriod));
        
        emit GovernanceSettingsUpdated(
            "votingPeriod",
            oldPeriod,
            newVotingPeriod,
            currentProposalId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Update proposal threshold through governance
     */
    function setProposalThreshold(uint256 newProposalThreshold) public override onlyGovernance {
        uint256 oldThreshold = proposalThreshold();
        super.setProposalThreshold(newProposalThreshold);
        
        emit GovernanceSettingsUpdated(
            "proposalThreshold",
            oldThreshold,
            newProposalThreshold,
            currentProposalId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Toggle fallback voting system
     */
    function setFallbackVoting(bool enabled) external onlyOwner {
        fallbackVotingEnabled = enabled;
        emit ParameterUpdated("fallbackVotingEnabled", enabled ? 0 : 1, enabled ? 1 : 0, 0);
    }
    
    // ==================== STEP 3: ADMINISTRATIVE FUNCTIONS ====================
    
    /**
     * @dev Add or remove agent from whitelist
     * @param agent Agent address to whitelist/unwhitelist
     * @param whitelisted Whether to whitelist or remove from whitelist
     */
    function setAgentWhitelist(address agent, bool whitelisted) external onlyOwner {
        require(agent != address(0), "Invalid agent address");
        whitelistedAgents[agent] = whitelisted;
        
        emit HederaEVMAgentInteraction(
            agent,
            whitelisted ? "whitelist_added" : "whitelist_removed",
            abi.encode(whitelisted),
            block.timestamp
        );
        
        emit ParameterUpdated(
            "agentWhitelist",
            whitelisted ? 0 : 1,
            whitelisted ? 1 : 0,
            0
        );
    }
    
    /**
     * @dev Enable or disable agent proposals
     * @param enabled Whether agent proposals are enabled
     */
    function setAgentProposalsEnabled(bool enabled) external onlyOwner {
        agentProposalsEnabled = enabled;
        emit ParameterUpdated("agentProposalsEnabled", enabled ? 0 : 1, enabled ? 1 : 0, 0);
    }
    
    /**
     * @dev Update maximum agent proposals per day
     * @param newLimit New daily limit for agent proposals
     */
    function setMaxAgentProposalsPerDay(uint256 newLimit) external onlyOwner {
        require(newLimit > 0, "Limit must be greater than 0");
        uint256 oldLimit = maxAgentProposalsPerDay;
        maxAgentProposalsPerDay = newLimit;
        emit ParameterUpdated("maxAgentProposalsPerDay", oldLimit, newLimit, 0);
    }
    
    /**
     * @dev Reset agent proposal count (emergency function)
     * @param agent Agent address to reset
     */
    function resetAgentProposalCount(address agent) external onlyOwner {
        agentProposalCount[agent] = 0;
        agentLastProposalDay[agent] = 0;
        
        emit HederaEVMAgentInteraction(
            agent,
            "proposal_count_reset",
            abi.encode(0),
            block.timestamp
        );
    }
    
    // ==================== END STEP 3: ADMINISTRATIVE FUNCTIONS ====================
    
    // View functions for frontend/subgraph
    
    /**
     * @dev Get proposal data for frontend display
     */
    function getProposalData(uint256 proposalId) 
        external 
        view 
        returns (ProposalData memory) 
    {
        return proposalData[proposalId];
    }
    
    /**
     * @dev Check if an address is authorized to report
     */
    function isAuthorizedReporter(address reporter) external view returns (bool) {
        return authorizedReporters[reporter];
    }
    
    // ==================== STEP 3: VIEW FUNCTIONS ====================
    
    /**
     * @dev Check if an agent is whitelisted for proposals
     */
    function isAgentWhitelisted(address agent) external view returns (bool) {
        return whitelistedAgents[agent];
    }
    
    /**
     * @dev Check if an agent can submit proposals
     */
    function canAgentSubmitProposal(address agent) external view returns (bool) {
        if (!agentProposalsEnabled) return false;
        if (!registry.isRegistered(agent) && !whitelistedAgents[agent]) return false;
        
        uint256 currentDay = block.timestamp / 1 days;
        if (agentLastProposalDay[agent] < currentDay) {
            return true; // New day, count reset
        }
        
        return agentProposalCount[agent] < maxAgentProposalsPerDay;
    }
    
    /**
     * @dev Get agent's remaining proposals for today
     */
    function getAgentRemainingProposals(address agent) external view returns (uint256) {
        if (!agentProposalsEnabled) return 0;
        if (!registry.isRegistered(agent) && !whitelistedAgents[agent]) return 0;
        
        uint256 currentDay = block.timestamp / 1 days;
        if (agentLastProposalDay[agent] < currentDay) {
            return maxAgentProposalsPerDay; // New day, full limit available
        }
        
        if (agentProposalCount[agent] >= maxAgentProposalsPerDay) {
            return 0;
        }
        
        return maxAgentProposalsPerDay - agentProposalCount[agent];
    }
    
    /**
     * @dev Check if a cross-chain trigger has been processed
     */
    function isCrossChainTriggerProcessed(bytes32 triggerHash) external view returns (bool) {
        return processedCrossChainTriggers[triggerHash];
    }
    
    /**
     * @dev Get proposal ID for a Chainlink request
     */
    function getProposalForChainlinkRequest(bytes32 requestId) external view returns (uint256) {
        return chainlinkRequestToProposal[requestId];
    }
    
    /**
     * @dev Get comprehensive agent proposal stats
     */
    function getAgentProposalStats(address agent) external view returns (
        bool canPropose,
        uint256 remainingProposals,
        uint256 totalProposalsToday,
        uint256 dailyLimit,
        bool isRegistered,
        bool isWhitelisted
    ) {
        canPropose = this.canAgentSubmitProposal(agent);
        remainingProposals = this.getAgentRemainingProposals(agent);
        
        uint256 currentDay = block.timestamp / 1 days;
        if (agentLastProposalDay[agent] < currentDay) {
            totalProposalsToday = 0;
        } else {
            totalProposalsToday = agentProposalCount[agent];
        }
        
        dailyLimit = maxAgentProposalsPerDay;
        isRegistered = registry.isRegistered(agent);
        isWhitelisted = whitelistedAgents[agent];
    }
    
    // ==================== END STEP 3: VIEW FUNCTIONS ====================
    
    /**
     * @dev Enhanced voting with fallback mechanism
     * If a user has no voting tokens, they can still vote with 1 vote per address
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal override returns (uint256) {
        uint256 weight = _getVotes(account, proposalSnapshot(proposalId), params);
        bool isFallbackVote = false;
        
        // Fallback to 1-vote-per-address if no tokens and fallback is enabled
        if (weight == 0 && fallbackVotingEnabled && !hasVotedInProposal[proposalId][account]) {
            weight = 1;
            isFallbackVote = true;
            hasVotedInProposal[proposalId][account] = true;
        }
        
        _countVote(proposalId, account, support, weight, params);
        
        if (params.length == 0) {
            emit VoteCast(account, proposalId, support, weight, reason);
        } else {
            emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
        }
        
        // Emit enhanced event with full data for subgraph
        emit VoteCastWithFullData(
            account,
            proposalId,
            support,
            weight,
            reason,
            isFallbackVote,
            block.timestamp
        );
        
        return weight;
    }
    
    /**
     * @dev Override propose to track current proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        currentProposalId = proposalId;
        return proposalId;
    }
    
    /**
     * @dev Check if an address has used fallback voting for a specific proposal
     */
    function hasUsedFallbackVote(uint256 proposalId, address account) external view returns (bool) {
        return hasVotedInProposal[proposalId][account];
    }
    
    /**
     * @dev Get effective voting weight (including fallback)
     */
    function getEffectiveVotingWeight(address account, uint256 proposalId) external view returns (uint256, bool) {
        uint256 tokenWeight = _getVotes(account, proposalSnapshot(proposalId), "");
        bool isFallbackEligible = tokenWeight == 0 && fallbackVotingEnabled && !hasVotedInProposal[proposalId][account];
        
        uint256 effectiveWeight = tokenWeight;
        if (isFallbackEligible) {
            effectiveWeight = 1;
        }
        
        return (effectiveWeight, isFallbackEligible);
    }
    
    // Required overrides
    
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    // Override for flexibility (e.g., support batch proposals) - Step 2 requirement
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Required Governor implementations
    function COUNTING_MODE() public pure override returns (string memory) {
        return "support=bravo&quorum=for,abstain";
    }

    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory params
    ) internal override returns (uint256) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        require(!proposalVote.hasVoted[account], "GovernorVotingSimple: vote already cast");
        proposalVote.hasVoted[account] = true;

        if (support == 0) { // Against
            proposalVote.againstVotes += weight;
        } else if (support == 1) { // For
            proposalVote.forVotes += weight;
        } else if (support == 2) { // Abstain
            proposalVote.abstainVotes += weight;
        } else {
            revert("GovernorVotingSimple: invalid value for enum VoteType");
        }
        
        return weight;
    }

    function hasVoted(uint256 proposalId, address account) public view override returns (bool) {
        return _proposalVotes[proposalId].hasVoted[account] || hasVotedInProposal[proposalId][account];
    }

    function _quorumReached(uint256 proposalId) internal view override returns (bool) {
        return quorum(proposalSnapshot(proposalId)) <= _proposalVotes[proposalId].forVotes + _proposalVotes[proposalId].abstainVotes;
    }

    function _voteSucceeded(uint256 proposalId) internal view override returns (bool) {
        return _proposalVotes[proposalId].forVotes > _proposalVotes[proposalId].againstVotes;
    }

    // Required TimelockControl overrides
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    // ENHANCED VERSION WITH EVENT LOGIC:
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        ProposalData storage proposal = proposalData[proposalId];
        
        int256 oldReputation = 0;
        if (proposal.targetAgent != address(0)) {
            oldReputation = registry.getAgentReputation(proposal.targetAgent);
        }
        
        // Execute the proposal
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
        
        proposal.executed = true;
        
        // Emit detailed events for different proposal types
        if (proposal.targetAgent != address(0)) {
            int256 newReputation = registry.getAgentReputation(proposal.targetAgent);
            
            if (proposal.proposalType == ProposalType.REPUTATION_UPDATE ||
                proposal.proposalType == ProposalType.MALICIOUS_REPORT) {
                emit ReputationUpdated(
                    proposal.targetAgent,
                    oldReputation,
                    newReputation,
                    proposal.reputationDelta,
                    proposalId,
                    proposal.reason
                );
            }
            
            if (proposal.proposalType == ProposalType.BLACKLIST_AGENT) {
                emit AgentBlacklisted(
                    proposal.targetAgent,
                    true, // blacklisted status would be extracted from calldata
                    proposalId,
                    proposal.reason,
                    block.timestamp
                );
            }
            
            if (proposal.proposalType == ProposalType.CROSS_CHAIN_SYNC) {
                emit CrossChainSyncRequested(
                    proposal.targetAgent,
                    newReputation,
                    proposalId,
                    block.timestamp
                );
            }
        }
        
        emit ProposalExecutedWithDetails(
            proposalId,
            proposal.proposalType,
            proposal.targetAgent,
            proposal.reputationDelta,
            true,
            block.timestamp
        );
    }
}
