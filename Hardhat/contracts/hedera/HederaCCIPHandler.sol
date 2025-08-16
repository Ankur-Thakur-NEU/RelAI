// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title HederaCCIPHandler
 * @dev Handles incoming DAO decisions from Sepolia and executes them on Hedera
 * @notice Receives CCIP messages from Sepolia DAO and coordinates with AgentRegistry
 */
contract HederaCCIPHandler is CCIPReceiver, Ownable {
    using SafeERC20 for IERC20;
    
    // ==================== INTERFACES ====================
    
    interface IAgentRegistry {
        function updateReputation(address agent, int256 delta) external;
        function overrideReputation(address agent, int256 newReputation) external;
        function getAgentReputation(address agent) external view returns (int256);
        function isAgentRegistered(address agent) external view returns (bool);
        function setAgentStatus(address agent, bool isActive) external;
    }
    
    interface ICCIPSender {
        function sendMessage(
            uint64 destinationChain,
            address receiver,
            string memory messageType,
            bytes memory data
        ) external returns (bytes32);
    }
    
    // ==================== STRUCTS ====================
    
    struct DAODecision {
        uint256 proposalId;
        address targetAgent;
        int256 newReputation;
        uint256 timestamp;
        uint64 sourceChain;
        bool executed;
        bytes32 ccipMessageId;
    }
    
    struct CCIPConfig {
        uint64 sepoliaChainSelector;
        address sepoliaStateMirror;
        address ccipSender;
        bool enabled;
    }
    
    // ==================== STATE VARIABLES ====================
    
    IAgentRegistry public agentRegistry;
    CCIPConfig public ccipConfig;
    
    // DAO decision tracking
    mapping(bytes32 => DAODecision) public daoDecisions;
    mapping(uint256 => bytes32) public proposalToMessageId;
    bytes32[] public allDecisionIds;
    
    // CCIP Security
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;
    
    // Statistics
    uint256 public totalDAODecisionsExecuted;
    uint256 public totalReputationOverrides;
    
    // ==================== EVENTS ====================
    
    event DAODecisionReceived(
        bytes32 indexed messageId,
        uint256 indexed proposalId,
        address indexed targetAgent,
        int256 newReputation,
        uint64 sourceChain
    );
    
    event ReputationOverrideExecuted(
        bytes32 indexed messageId,
        address indexed agent,
        int256 oldReputation,
        int256 newReputation,
        uint256 proposalId
    );
    
    event StateMirrorUpdateSent(
        bytes32 indexed messageId,
        string messageType,
        address indexed agent,
        bytes data
    );
    
    event CCIPConfigUpdated(
        uint64 sepoliaChainSelector,
        address sepoliaStateMirror,
        address ccipSender,
        bool enabled
    );
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        address _router,
        address _agentRegistry,
        uint64 _sepoliaChainSelector,
        address _sepoliaSender
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        
        ccipConfig = CCIPConfig({
            sepoliaChainSelector: _sepoliaChainSelector,
            sepoliaStateMirror: address(0), // Set later
            ccipSender: address(0), // Set later
            enabled: true
        });
        
        // Allowlist Sepolia chain and sender
        allowlistedSourceChains[_sepoliaChainSelector] = true;
        allowlistedSenders[_sepoliaSender] = true;
    }
    
    // ==================== CCIP MESSAGE HANDLING ====================
    
    /**
     * @dev Handle incoming CCIP messages from Sepolia DAO
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        require(
            allowlistedSourceChains[message.sourceChainSelector],
            "Source chain not allowlisted"
        );
        require(
            allowlistedSenders[abi.decode(message.sender, (address))],
            "Sender not allowlisted"
        );
        
        // Decode message
        (string memory messageType, bytes memory data) = abi.decode(
            message.data,
            (string, bytes)
        );
        
        // Route to appropriate handler
        if (keccak256(abi.encodePacked(messageType)) == keccak256("DAO_REPUTATION_OVERRIDE")) {
            _handleReputationOverride(message.messageId, data, message.sourceChainSelector);
        } else if (keccak256(abi.encodePacked(messageType)) == keccak256("DAO_AGENT_STATUS")) {
            _handleAgentStatusChange(data);
        } else if (keccak256(abi.encodePacked(messageType)) == keccak256("DAO_EMERGENCY_ACTION")) {
            _handleEmergencyAction(data);
        }
    }
    
    /**
     * @dev Handle reputation override from DAO
     */
    function _handleReputationOverride(
        bytes32 messageId,
        bytes memory data,
        uint64 sourceChain
    ) internal {
        (
            address targetAgent,
            int256 newReputation,
            uint256 proposalId,
            uint256 timestamp
        ) = abi.decode(data, (address, int256, uint256, uint256));
        
        require(agentRegistry.isAgentRegistered(targetAgent), "Agent not registered");
        require(targetAgent != address(0), "Invalid agent address");
        
        // Get current reputation
        int256 oldReputation = agentRegistry.getAgentReputation(targetAgent);
        
        // Store DAO decision
        daoDecisions[messageId] = DAODecision({
            proposalId: proposalId,
            targetAgent: targetAgent,
            newReputation: newReputation,
            timestamp: timestamp,
            sourceChain: sourceChain,
            executed: false,
            ccipMessageId: messageId
        });
        
        proposalToMessageId[proposalId] = messageId;
        allDecisionIds.push(messageId);
        
        emit DAODecisionReceived(
            messageId,
            proposalId,
            targetAgent,
            newReputation,
            sourceChain
        );
        
        // Execute the override
        _executeReputationOverride(messageId, oldReputation);
    }
    
    /**
     * @dev Execute reputation override
     */
    function _executeReputationOverride(bytes32 messageId, int256 oldReputation) internal {
        DAODecision storage decision = daoDecisions[messageId];
        require(!decision.executed, "Already executed");
        
        // Execute on AgentRegistry
        agentRegistry.overrideReputation(decision.targetAgent, decision.newReputation);
        
        // Mark as executed
        decision.executed = true;
        totalDAODecisionsExecuted++;
        totalReputationOverrides++;
        
        emit ReputationOverrideExecuted(
            messageId,
            decision.targetAgent,
            oldReputation,
            decision.newReputation,
            decision.proposalId
        );
        
        // Send state update to Sepolia State Mirror
        _sendStateMirrorUpdate(
            "REPUTATION_UPDATED",
            abi.encode(
                decision.targetAgent,
                oldReputation,
                decision.newReputation,
                "dao_override",
                keccak256(abi.encodePacked(messageId, block.timestamp))
            )
        );
    }
    
    /**
     * @dev Handle agent status change from DAO
     */
    function _handleAgentStatusChange(bytes memory data) internal {
        (address agent, bool isActive, string memory reason) = abi.decode(
            data,
            (address, bool, string)
        );
        
        require(agentRegistry.isAgentRegistered(agent), "Agent not registered");
        
        // Execute status change
        agentRegistry.setAgentStatus(agent, isActive);
        
        // Send update to state mirror
        _sendStateMirrorUpdate(
            "AGENT_STATUS_CHANGED",
            abi.encode(agent, isActive, reason)
        );
    }
    
    /**
     * @dev Handle emergency actions from DAO
     */
    function _handleEmergencyAction(bytes memory data) internal {
        (string memory actionType, bytes memory actionData) = abi.decode(
            data,
            (string, bytes)
        );
        
        // Process emergency actions (implement based on specific needs)
        if (keccak256(abi.encodePacked(actionType)) == keccak256("PAUSE_SYSTEM")) {
            // Implement system pause logic
        } else if (keccak256(abi.encodePacked(actionType)) == keccak256("UPDATE_CONFIG")) {
            // Implement config update logic
        }
    }
    
    // ==================== STATE MIRROR COMMUNICATION ====================
    
    /**
     * @dev Send update to Sepolia State Mirror
     */
    function _sendStateMirrorUpdate(string memory messageType, bytes memory data) internal {
        if (ccipConfig.ccipSender != address(0) && 
            ccipConfig.sepoliaStateMirror != address(0) && 
            ccipConfig.enabled) {
            
            try ICCIPSender(ccipConfig.ccipSender).sendMessage(
                ccipConfig.sepoliaChainSelector,
                ccipConfig.sepoliaStateMirror,
                messageType,
                data
            ) returns (bytes32 messageId) {
                emit StateMirrorUpdateSent(messageId, messageType, address(0), data);
            } catch {
                // Log error but don't revert main transaction
            }
        }
    }
    
    // ==================== PUBLIC FUNCTIONS ====================
    
    /**
     * @dev Manual reputation override execution (in case auto-execution fails)
     */
    function executeReputationOverride(bytes32 messageId) external {
        DAODecision storage decision = daoDecisions[messageId];
        require(decision.targetAgent != address(0), "Decision not found");
        require(!decision.executed, "Already executed");
        
        int256 oldReputation = agentRegistry.getAgentReputation(decision.targetAgent);
        _executeReputationOverride(messageId, oldReputation);
    }
    
    /**
     * @dev Send agent registration update to state mirror (called by AgentRegistry)
     */
    function notifyAgentRegistration(
        address agent,
        string memory tag,
        bytes32 hederaTxHash
    ) external {
        require(msg.sender == address(agentRegistry) || msg.sender == owner(), "Unauthorized");
        
        _sendStateMirrorUpdate(
            "AGENT_REGISTERED",
            abi.encode(agent, tag, hederaTxHash)
        );
    }
    
    /**
     * @dev Send transaction finalization to state mirror (called by transaction contracts)
     */
    function notifyTransactionFinalized(
        address buyer,
        address seller,
        int8 rating,
        string memory transactionType,
        uint256 amount,
        bytes32 hederaTxHash
    ) external {
        // Add access control as needed
        require(allowlistedSenders[msg.sender] || msg.sender == owner(), "Unauthorized");
        
        _sendStateMirrorUpdate(
            "TRANSACTION_FINALIZED",
            abi.encode(buyer, seller, rating, transactionType, amount, hederaTxHash)
        );
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get DAO decision details
     */
    function getDAODecision(bytes32 messageId) external view returns (DAODecision memory) {
        return daoDecisions[messageId];
    }
    
    /**
     * @dev Get all DAO decision IDs
     */
    function getAllDecisionIds() external view returns (bytes32[] memory) {
        return allDecisionIds;
    }
    
    /**
     * @dev Get statistics
     */
    function getStatistics() external view returns (
        uint256 totalDecisions,
        uint256 totalOverrides,
        uint256 pendingDecisions
    ) {
        totalDecisions = allDecisionIds.length;
        totalOverrides = totalReputationOverrides;
        
        // Count pending decisions
        for (uint256 i = 0; i < allDecisionIds.length; i++) {
            if (!daoDecisions[allDecisionIds[i]].executed) {
                pendingDecisions++;
            }
        }
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Update CCIP configuration
     */
    function updateCCIPConfig(
        uint64 sepoliaChainSelector,
        address sepoliaStateMirror,
        address ccipSender,
        bool enabled
    ) external onlyOwner {
        ccipConfig = CCIPConfig({
            sepoliaChainSelector: sepoliaChainSelector,
            sepoliaStateMirror: sepoliaStateMirror,
            ccipSender: ccipSender,
            enabled: enabled
        });
        
        emit CCIPConfigUpdated(
            sepoliaChainSelector,
            sepoliaStateMirror,
            ccipSender,
            enabled
        );
    }
    
    /**
     * @dev Update allowlists
     */
    function updateAllowlists(
        uint64[] memory chainSelectors,
        address[] memory senders,
        bool[] memory statuses
    ) external onlyOwner {
        require(chainSelectors.length == statuses.length, "Length mismatch");
        require(senders.length == statuses.length, "Length mismatch");
        
        for (uint256 i = 0; i < chainSelectors.length; i++) {
            allowlistedSourceChains[chainSelectors[i]] = statuses[i];
        }
        
        for (uint256 i = 0; i < senders.length; i++) {
            allowlistedSenders[senders[i]] = statuses[i];
        }
    }
    
    /**
     * @dev Update Agent Registry address
     */
    function setAgentRegistry(address newRegistry) external onlyOwner {
        require(newRegistry != address(0), "Invalid address");
        agentRegistry = IAgentRegistry(newRegistry);
    }
    
    /**
     * @dev Emergency pause CCIP processing
     */
    function emergencyPause(bool paused) external onlyOwner {
        ccipConfig.enabled = !paused;
    }
}
