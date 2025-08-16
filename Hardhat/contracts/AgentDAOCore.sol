// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentDAOCore
 * @dev Streamlined DAO governance contract optimized for Hedera deployment
 * @notice Core DAO functionality for managing AI agent reputation and disputes
 */

interface IAgentRegistry {
    function updateReputation(address agent, int256 delta) external;
    function reportMalicious(address agent, string calldata evidence) external;
    function getAgentReputation(address agent) external view returns (int256);
    function isAgentRegistered(address agent) external view returns (bool);
    function isRegistered(address agent) external view returns (bool);
    function getAgentType(address agent) external view returns (string memory);
    function isAgentWhitelisted(address agent) external view returns (bool);
}

contract AgentDAOCore is 
    Governor, 
    GovernorSettings, 
    GovernorVotes, 
    GovernorVotesQuorumFraction, 
    GovernorTimelockControl,
    Ownable 
{
    IAgentRegistry public immutable registry;
    
    // Fallback voting system
    bool public fallbackVotingEnabled = true;
    mapping(uint256 => mapping(address => bool)) public hasVotedInProposal;
    
    // Step 3: Agent interaction parameters
    mapping(address => bool) public whitelistedAgents;
    bool public agentProposalsEnabled = true;
    uint256 public maxAgentProposalsPerDay = 10;
    mapping(address => uint256) public agentProposalCount;
    mapping(address => uint256) public agentLastProposalDay;
    
    // Governor voting system
    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }
    mapping(uint256 => ProposalVote) private _proposalVotes;
    
    // Core events
    event ReputationProposalCreated(uint256 indexed proposalId, address indexed agent, int256 delta, string description);
    event DAOReputationUpdate(address indexed agent, int256 delta, address indexed executor, uint256 timestamp);
    event AgentProposalSubmitted(uint256 indexed proposalId, address indexed agent, string agentType, string description, uint256 timestamp);
    
    // Modifiers
    modifier onlyDAOGovernance() {
        require(msg.sender == address(this), "Only DAO governance can execute");
        _;
    }
    
    modifier onlyRegisteredAgent() {
        require(registry.isRegistered(msg.sender), "Caller not registered agent");
        _;
    }
    
    modifier agentRateLimited() {
        require(agentProposalsEnabled, "Agent proposals disabled");
        uint256 currentDay = block.timestamp / 1 days;
        if (agentLastProposalDay[msg.sender] < currentDay) {
            agentProposalCount[msg.sender] = 0;
            agentLastProposalDay[msg.sender] = currentDay;
        }
        require(agentProposalCount[msg.sender] < maxAgentProposalsPerDay, "Daily limit exceeded");
        agentProposalCount[msg.sender]++;
        _;
    }

    constructor(
        IVotes _token,
        address _registry,
        TimelockController _timelock
    )
        Governor("AgentDAO")
        GovernorSettings(1, 46027, 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
        Ownable(msg.sender)
    {
        registry = IAgentRegistry(_registry);
    }
    
    // ==================== CORE GOVERNANCE FUNCTIONS - STEP 2 ====================
    
    /**
     * @dev Core function to propose reputation changes
     */
    function proposeReputationChange(address agent, int256 delta, string memory description) external returns (uint256) {
        require(registry.isAgentRegistered(agent), "Agent not registered");
        require(bytes(description).length > 0, "Description required");
        
        address[] memory targets = new address[](1);
        targets[0] = address(registry);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(IAgentRegistry.updateReputation.selector, agent, delta);

        uint256 proposalId = propose(targets, values, calldatas, description);
        emit ReputationProposalCreated(proposalId, agent, delta, description);
        return proposalId;
    }
    
    /**
     * @dev DAO-executable function to update reputation
     */
    function daoUpdateReputation(address agent, int256 delta) external onlyDAOGovernance {
        registry.updateReputation(agent, delta);
        emit DAOReputationUpdate(agent, delta, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Allow changing quorum via proposal
     */
    function setQuorumFraction(uint256 newQuorum) external onlyDAOGovernance {
        _updateQuorumNumerator(newQuorum);
    }
    
    // ==================== HEDERA EVM & AGENT INTEGRATION - STEP 3 ====================
    
    /**
     * @dev Core function for agents to submit proposals programmatically
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
        
        string memory agentType = "";
        try registry.getAgentType(msg.sender) returns (string memory aType) {
            agentType = aType;
        } catch {
            agentType = "unknown";
        }
        
        emit AgentProposalSubmitted(proposalId, msg.sender, agentType, description, block.timestamp);
        return proposalId;
    }
    
    /**
     * @dev Simplified agent proposal for reputation changes
     */
    function submitReputationProposalFromAgent(address agent, int256 delta, string memory description) 
        external onlyRegisteredAgent agentRateLimited returns (uint256) {
        require(registry.isAgentRegistered(agent), "Target agent not registered");
        require(bytes(description).length > 0, "Description required");
        
        address[] memory targets = new address[](1);
        targets[0] = address(registry);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(IAgentRegistry.updateReputation.selector, agent, delta);
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        string memory agentType = "";
        try registry.getAgentType(msg.sender) returns (string memory aType) {
            agentType = aType;
        } catch {
            agentType = "unknown";
        }
        
        emit AgentProposalSubmitted(proposalId, msg.sender, agentType, description, block.timestamp);
        emit ReputationProposalCreated(proposalId, agent, delta, description);
        return proposalId;
    }
    
    // Administrative functions
    function setAgentWhitelist(address agent, bool whitelisted) external onlyOwner {
        require(agent != address(0), "Invalid agent address");
        whitelistedAgents[agent] = whitelisted;
    }
    
    function setAgentProposalsEnabled(bool enabled) external onlyOwner {
        agentProposalsEnabled = enabled;
    }
    
    function setMaxAgentProposalsPerDay(uint256 newLimit) external onlyOwner {
        require(newLimit > 0, "Limit must be greater than 0");
        maxAgentProposalsPerDay = newLimit;
    }
    
    // View functions
    function isAgentWhitelisted(address agent) external view returns (bool) {
        return whitelistedAgents[agent];
    }
    
    function canAgentSubmitProposal(address agent) external view returns (bool) {
        if (!agentProposalsEnabled) return false;
        if (!registry.isRegistered(agent) && !whitelistedAgents[agent]) return false;
        
        uint256 currentDay = block.timestamp / 1 days;
        if (agentLastProposalDay[agent] < currentDay) return true;
        return agentProposalCount[agent] < maxAgentProposalsPerDay;
    }
    
    // Enhanced voting with fallback mechanism
    function _castVote(uint256 proposalId, address account, uint8 support, string memory reason, bytes memory params) 
        internal override returns (uint256) {
        uint256 weight = _getVotes(account, proposalSnapshot(proposalId), params);
        
        // Fallback to 1-vote-per-address if no tokens
        if (weight == 0 && fallbackVotingEnabled && !hasVotedInProposal[proposalId][account]) {
            weight = 1;
            hasVotedInProposal[proposalId][account] = true;
        }
        
        _countVote(proposalId, account, support, weight, params);
        
        if (params.length == 0) {
            emit VoteCast(account, proposalId, support, weight, reason);
        } else {
            emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
        }
        
        return weight;
    }
    
    // Required overrides
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) 
        internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Required Governor implementations
    function COUNTING_MODE() public pure override returns (string memory) {
        return "support=bravo&quorum=for,abstain";
    }

    function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight, bytes memory params) 
        internal override returns (uint256) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        require(!proposalVote.hasVoted[account], "Already voted");
        proposalVote.hasVoted[account] = true;

        if (support == 0) { // Against
            proposalVote.againstVotes += weight;
        } else if (support == 1) { // For
            proposalVote.forVotes += weight;
        } else if (support == 2) { // Abstain
            proposalVote.abstainVotes += weight;
        } else {
            revert("Invalid vote type");
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

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) 
        internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) 
        internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
}
