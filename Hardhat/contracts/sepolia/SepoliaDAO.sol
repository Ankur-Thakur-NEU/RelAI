// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SepoliaDAO
 * @dev Clean DAO governance on Sepolia that sends decisions to Hedera via CCIP
 * @notice Handles all governance decisions and sends execution commands cross-chain
 */
contract SepoliaDAO is Governor, GovernorSettings, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl {
    
    // ==================== INTERFACES ====================
    
    interface ICCIPSender {
        function sendReputationOverride(
            address targetAgent,
            int256 newReputation,
            uint256 proposalId
        ) external returns (bytes32 messageId);
        
        function sendDAODecision(
            string memory messageType,
            bytes memory data
        ) external returns (bytes32);
    }
    
    // ==================== STATE VARIABLES ====================
    
    ICCIPSender public ccipSender;
    uint64 public hederaChainSelector;
    address public hederaAgentManager;
    
    // Proposal tracking
    mapping(uint256 => bytes32) public proposalToCCIPMessage;
    mapping(bytes32 => uint256) public ccipMessageToProposal;
    
    // Statistics
    uint256 public totalProposalsExecutedCrossChain;
    uint256 public totalReputationOverrides;
    
    // ==================== EVENTS ====================
    
    event ProposalExecutedCrossChain(
        uint256 indexed proposalId,
        address indexed targetAgent,
        int256 reputationOverride,
        bytes32 ccipMessageId
    );
    
    event CCIPConfigurationUpdated(
        address ccipSender,
        uint64 hederaChainSelector,
        address hederaAgentManager
    );
    
    event ReputationOverrideProposed(
        uint256 indexed proposalId,
        address indexed agent,
        int256 newReputation,
        string reason
    );
    
    event AgentStatusChangeProposed(
        uint256 indexed proposalId,
        address indexed agent,
        bool newStatus,
        string reason
    );
    
    event CrossChainExecutionFailed(
        uint256 indexed proposalId,
        bytes32 ccipMessageId,
        string reason
    );
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _ccipSender,
        uint64 _hederaChainSelector,
        address _hederaAgentManager
    )
        Governor("SepoliaDAO")
        GovernorSettings(1, 46027, 0) // 1 block delay, ~7 days voting, 0 threshold
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(_timelock)
    {
        ccipSender = ICCIPSender(_ccipSender);
        hederaChainSelector = _hederaChainSelector;
        hederaAgentManager = _hederaAgentManager;
    }
    
    // ==================== PROPOSAL CREATION ====================
    
    /**
     * @dev Create a reputation override proposal
     * @param agent Target agent address
     * @param newReputation New reputation value to set
     * @param reason Governance reason for change
     */
    function proposeReputationOverride(
        address agent,
        int256 newReputation,
        string memory reason
    ) external returns (uint256) {
        require(agent != address(0), "Invalid agent address");
        require(bytes(reason).length > 0, "Reason required");
        
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(this);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            this.executeReputationOverride.selector,
            agent,
            newReputation
        );
        
        string memory description = string(abi.encodePacked(
            "Reputation Override: Set ",
            _addressToString(agent),
            " to ",
            _int256ToString(newReputation),
            ". Reason: ",
            reason
        ));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        emit ReputationOverrideProposed(proposalId, agent, newReputation, reason);
        
        return proposalId;
    }
    
    /**
     * @dev Create an agent status change proposal
     * @param agent Target agent address
     * @param newStatus New active status (true/false)
     * @param reason Reason for status change
     */
    function proposeAgentStatusChange(
        address agent,
        bool newStatus,
        string memory reason
    ) external returns (uint256) {
        require(agent != address(0), "Invalid agent address");
        require(bytes(reason).length > 0, "Reason required");
        
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(this);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            this.executeAgentStatusChange.selector,
            agent,
            newStatus,
            reason
        );
        
        string memory statusText = newStatus ? "activate" : "deactivate";
        string memory description = string(abi.encodePacked(
            "Agent Status Change: ",
            statusText,
            " ",
            _addressToString(agent),
            ". Reason: ",
            reason
        ));
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        emit AgentStatusChangeProposed(proposalId, agent, newStatus, reason);
        
        return proposalId;
    }
    
    /**
     * @dev Create a custom DAO decision proposal
     * @param messageType Type of decision to send to Hedera
     * @param data Encoded decision data
     * @param description Human-readable description
     */
    function proposeCustomDecision(
        string memory messageType,
        bytes memory data,
        string memory description
    ) external returns (uint256) {
        require(bytes(messageType).length > 0, "Message type required");
        require(data.length > 0, "Data required");
        require(bytes(description).length > 0, "Description required");
        
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(this);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            this.executeCustomDecision.selector,
            messageType,
            data
        );
        
        return propose(targets, values, calldatas, description);
    }
    
    // ==================== EXECUTION FUNCTIONS ====================
    
    /**
     * @dev Execute reputation override (called by DAO after proposal passes)
     * @param agent Target agent
     * @param newReputation New reputation value
     */
    function executeReputationOverride(
        address agent,
        int256 newReputation
    ) external onlyGovernance {
        uint256 proposalId = _getCurrentProposalId();
        
        // Send CCIP message to Hedera
        try ccipSender.sendReputationOverride(agent, newReputation, proposalId) 
        returns (bytes32 messageId) {
            
            // Track the cross-chain execution
            proposalToCCIPMessage[proposalId] = messageId;
            ccipMessageToProposal[messageId] = proposalId;
            
            totalProposalsExecutedCrossChain++;
            totalReputationOverrides++;
            
            emit ProposalExecutedCrossChain(
                proposalId,
                agent,
                newReputation,
                messageId
            );
            
        } catch Error(string memory reason) {
            emit CrossChainExecutionFailed(proposalId, bytes32(0), reason);
            revert(string(abi.encodePacked("CCIP execution failed: ", reason)));
        }
    }
    
    /**
     * @dev Execute agent status change (called by DAO after proposal passes)
     * @param agent Target agent
     * @param newStatus New active status
     * @param reason Reason for change
     */
    function executeAgentStatusChange(
        address agent,
        bool newStatus,
        string memory reason
    ) external onlyGovernance {
        uint256 proposalId = _getCurrentProposalId();
        
        bytes memory data = abi.encode(agent, newStatus, reason);
        
        try ccipSender.sendDAODecision("DAO_AGENT_STATUS", data) 
        returns (bytes32 messageId) {
            
            proposalToCCIPMessage[proposalId] = messageId;
            ccipMessageToProposal[messageId] = proposalId;
            totalProposalsExecutedCrossChain++;
            
            emit ProposalExecutedCrossChain(proposalId, agent, 0, messageId);
            
        } catch Error(string memory _reason) {
            emit CrossChainExecutionFailed(proposalId, bytes32(0), _reason);
            revert(string(abi.encodePacked("CCIP execution failed: ", _reason)));
        }
    }
    
    /**
     * @dev Execute custom DAO decision (called by DAO after proposal passes)
     * @param messageType Type of decision
     * @param data Decision data
     */
    function executeCustomDecision(
        string memory messageType,
        bytes memory data
    ) external onlyGovernance {
        uint256 proposalId = _getCurrentProposalId();
        
        try ccipSender.sendDAODecision(messageType, data) 
        returns (bytes32 messageId) {
            
            proposalToCCIPMessage[proposalId] = messageId;
            ccipMessageToProposal[messageId] = proposalId;
            totalProposalsExecutedCrossChain++;
            
            emit ProposalExecutedCrossChain(proposalId, address(0), 0, messageId);
            
        } catch Error(string memory reason) {
            emit CrossChainExecutionFailed(proposalId, bytes32(0), reason);
            revert(string(abi.encodePacked("CCIP execution failed: ", reason)));
        }
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get CCIP message ID for a proposal
     */
    function getProposalCCIPMessage(uint256 proposalId) external view returns (bytes32) {
        return proposalToCCIPMessage[proposalId];
    }
    
    /**
     * @dev Get proposal ID for a CCIP message
     */
    function getCCIPMessageProposal(bytes32 messageId) external view returns (uint256) {
        return ccipMessageToProposal[messageId];
    }
    
    /**
     * @dev Get DAO statistics
     */
    function getDAOStatistics() external view returns (
        uint256 totalProposals,
        uint256 totalExecutedCrossChain,
        uint256 totalRepOverrides,
        address ccipSenderAddress,
        uint64 hederaChainId
    ) {
        totalProposals = proposalCount();
        totalExecutedCrossChain = totalProposalsExecutedCrossChain;
        totalRepOverrides = totalReputationOverrides;
        ccipSenderAddress = address(ccipSender);
        hederaChainId = hederaChainSelector;
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Update CCIP configuration (only through governance)
     * @param newCCIPSender New CCIP sender address
     * @param newHederaChainSelector New Hedera chain selector
     * @param newHederaAgentManager New Hedera agent manager address
     */
    function updateCCIPConfiguration(
        address newCCIPSender,
        uint64 newHederaChainSelector,
        address newHederaAgentManager
    ) external onlyGovernance {
        require(newCCIPSender != address(0), "Invalid CCIP sender");
        
        ccipSender = ICCIPSender(newCCIPSender);
        hederaChainSelector = newHederaChainSelector;
        hederaAgentManager = newHederaAgentManager;
        
        emit CCIPConfigurationUpdated(
            newCCIPSender,
            newHederaChainSelector,
            newHederaAgentManager
        );
    }
    
    // ==================== REQUIRED OVERRIDES ====================
    
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
    
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
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
    
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(Governor, GovernorTimelockControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
    
    // ==================== INTERNAL HELPERS ====================
    
    /**
     * @dev Get current proposal ID (approximate, used for tracking)
     */
    function _getCurrentProposalId() internal view returns (uint256) {
        // This is an approximation - in production, you'd want more precise tracking
        return hashProposal(
            new address[](1),
            new uint256[](1),
            new bytes[](1),
            keccak256(abi.encodePacked("current-", block.timestamp))
        );
    }
    
    /**
     * @dev Convert address to string
     */
    function _addressToString(address _addr) internal pure returns (string memory) {
        return Strings.toHexString(uint160(_addr), 20);
    }
    
    /**
     * @dev Convert int256 to string
     */
    function _int256ToString(int256 value) internal pure returns (string memory) {
        if (value >= 0) {
            return Strings.toString(uint256(value));
        } else {
            return string(abi.encodePacked("-", Strings.toString(uint256(-value))));
        }
    }
}
