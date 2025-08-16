// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SepoliaStateMirror
 * @dev Pure state mirroring contract - receives Hedera events via CCIP and stores for Graph indexing
 * @notice NOT controlled by DAO - just mirrors Hedera state for complete visibility on Sepolia
 */
contract SepoliaStateMirror is CCIPReceiver, Ownable {
    
    // ==================== STRUCTS FOR STATE STORAGE ====================
    
    struct AgentInfo {
        address hederaWalletId;
        string tag; // "code-reviewer", "ai-agent", etc.
        uint256 registrationTimestamp;
        int256 currentReputation;
        bool isActive;
        uint256 lastUpdateTimestamp;
        uint64 sourceChain;
    }
    
    struct ReputationHistory {
        address agentWalletId;
        int256 oldReputation;
        int256 newReputation;
        int256 delta;
        string updateType; // "transaction", "dao_override", "slash"
        uint256 timestamp;
        uint64 sourceChain;
        bytes32 hederaTxHash; // Reference to Hedera transaction
    }
    
    struct TransactionRecord {
        address buyer;
        address seller;
        int8 rating; // [-3, 3]
        uint256 timestamp;
        uint64 sourceChain;
        bytes32 hederaTxHash;
        string transactionType; // "service", "product", etc.
        uint256 amount; // Optional: transaction amount
    }
    
    // ==================== STORAGE MAPPINGS ====================
    
    // Agent registry mirror
    mapping(address => AgentInfo) public agents;
    address[] public allAgents;
    mapping(address => bool) public isAgentRegistered;
    uint256 public totalAgentsRegistered;
    
    // Reputation tracking
    mapping(address => ReputationHistory[]) public reputationHistory;
    mapping(address => uint256) public reputationUpdateCount;
    
    // Transaction history
    mapping(address => TransactionRecord[]) public sellerTransactions;
    mapping(address => TransactionRecord[]) public buyerTransactions;
    TransactionRecord[] public allTransactions;
    uint256 public totalTransactions;
    
    // CCIP Security
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;
    uint64 public hederaChainSelector;
    
    // Statistics for The Graph
    mapping(string => uint256) public agentTypeCount; // Count by tag
    mapping(address => int256) public agentReputationSummary; // Latest reputation
    
    // ==================== EVENTS FOR THE GRAPH INDEXING ====================
    
    // Agent Events
    event AgentRegisteredMirror(
        address indexed hederaWalletId,
        string indexed tag,
        uint256 timestamp,
        uint64 sourceChain,
        bytes32 hederaTxHash
    );
    
    event AgentStatusUpdated(
        address indexed agent,
        bool isActive,
        uint256 timestamp,
        string reason
    );
    
    // Reputation Events
    event ReputationUpdatedMirror(
        address indexed agentWalletId,
        int256 oldReputation,
        int256 newReputation,
        int256 delta,
        string indexed updateType,
        uint256 timestamp,
        uint64 sourceChain,
        bytes32 hederaTxHash
    );
    
    // Transaction Events
    event TransactionFinalizedMirror(
        address indexed buyer,
        address indexed seller,
        int8 rating,
        uint256 timestamp,
        uint64 sourceChain,
        bytes32 indexed hederaTxHash,
        string transactionType,
        uint256 amount
    );
    
    // System Events
    event CCIPMessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        string messageType,
        uint256 timestamp
    );
    
    event StateStatisticsUpdated(
        uint256 totalAgents,
        uint256 totalTransactions,
        uint256 totalReputationUpdates
    );
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        address _router,
        uint64 _hederaChainSelector,
        address _hederaSender
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        hederaChainSelector = _hederaChainSelector;
        allowlistedSourceChains[_hederaChainSelector] = true;
        allowlistedSenders[_hederaSender] = true;
    }
    
    // ==================== CCIP MESSAGE HANDLING ====================
    
    /**
     * @dev Handle incoming CCIP messages from Hedera
     * @param message The CCIP message containing state updates
     */
    function _ccipReceive(Client.Any2EVMMessage memory message)
        internal
        override
    {
        require(
            allowlistedSourceChains[message.sourceChainSelector],
            "Source chain not allowlisted"
        );
        require(
            allowlistedSenders[abi.decode(message.sender, (address))],
            "Sender not allowlisted"
        );
        
        // Decode message type and data
        (string memory messageType, bytes memory data) = abi.decode(
            message.data, 
            (string, bytes)
        );
        
        emit CCIPMessageReceived(
            message.messageId,
            message.sourceChainSelector,
            abi.decode(message.sender, (address)),
            messageType,
            block.timestamp
        );
        
        // Route to appropriate handler
        if (keccak256(abi.encodePacked(messageType)) == keccak256("AGENT_REGISTERED")) {
            _handleAgentRegistration(data, message.sourceChainSelector);
        } else if (keccak256(abi.encodePacked(messageType)) == keccak256("REPUTATION_UPDATED")) {
            _handleReputationUpdate(data, message.sourceChainSelector);
        } else if (keccak256(abi.encodePacked(messageType)) == keccak256("TRANSACTION_FINALIZED")) {
            _handleTransactionFinalized(data, message.sourceChainSelector);
        } else if (keccak256(abi.encodePacked(messageType)) == keccak256("AGENT_STATUS_CHANGED")) {
            _handleAgentStatusChange(data);
        }
        
        _updateStatistics();
    }
    
    // ==================== MESSAGE HANDLERS ====================
    
    /**
     * @dev Handle agent registration from Hedera
     */
    function _handleAgentRegistration(bytes memory data, uint64 sourceChain) internal {
        (
            address hederaWalletId,
            string memory tag,
            bytes32 hederaTxHash
        ) = abi.decode(data, (address, string, bytes32));
        
        require(hederaWalletId != address(0), "Invalid wallet address");
        require(bytes(tag).length > 0, "Tag required");
        
        // Store agent info
        agents[hederaWalletId] = AgentInfo({
            hederaWalletId: hederaWalletId,
            tag: tag,
            registrationTimestamp: block.timestamp,
            currentReputation: 0, // Start with 0 reputation
            isActive: true,
            lastUpdateTimestamp: block.timestamp,
            sourceChain: sourceChain
        });
        
        if (!isAgentRegistered[hederaWalletId]) {
            allAgents.push(hederaWalletId);
            isAgentRegistered[hederaWalletId] = true;
            totalAgentsRegistered++;
            agentTypeCount[tag]++;
        }
        
        agentReputationSummary[hederaWalletId] = 0;
        
        emit AgentRegisteredMirror(
            hederaWalletId,
            tag,
            block.timestamp,
            sourceChain,
            hederaTxHash
        );
    }
    
    /**
     * @dev Handle reputation update from Hedera
     */
    function _handleReputationUpdate(bytes memory data, uint64 sourceChain) internal {
        (
            address agentWalletId,
            int256 oldReputation,
            int256 newReputation,
            string memory updateType,
            bytes32 hederaTxHash
        ) = abi.decode(data, (address, int256, int256, string, bytes32));
        
        require(isAgentRegistered[agentWalletId], "Agent not registered");
        
        int256 delta = newReputation - oldReputation;
        
        // Store reputation history
        reputationHistory[agentWalletId].push(ReputationHistory({
            agentWalletId: agentWalletId,
            oldReputation: oldReputation,
            newReputation: newReputation,
            delta: delta,
            updateType: updateType,
            timestamp: block.timestamp,
            sourceChain: sourceChain,
            hederaTxHash: hederaTxHash
        }));
        
        // Update current reputation
        agents[agentWalletId].currentReputation = newReputation;
        agents[agentWalletId].lastUpdateTimestamp = block.timestamp;
        agentReputationSummary[agentWalletId] = newReputation;
        reputationUpdateCount[agentWalletId]++;
        
        emit ReputationUpdatedMirror(
            agentWalletId,
            oldReputation,
            newReputation,
            delta,
            updateType,
            block.timestamp,
            sourceChain,
            hederaTxHash
        );
    }
    
    /**
     * @dev Handle transaction finalization from Hedera
     */
    function _handleTransactionFinalized(bytes memory data, uint64 sourceChain) internal {
        (
            address buyer,
            address seller,
            int8 rating,
            string memory transactionType,
            uint256 amount,
            bytes32 hederaTxHash
        ) = abi.decode(data, (address, address, int8, string, uint256, bytes32));
        
        require(buyer != address(0) && seller != address(0), "Invalid addresses");
        require(rating >= -3 && rating <= 3, "Rating must be between -3 and 3");
        require(isAgentRegistered[seller], "Seller not registered");
        
        TransactionRecord memory transaction = TransactionRecord({
            buyer: buyer,
            seller: seller,
            rating: rating,
            timestamp: block.timestamp,
            sourceChain: sourceChain,
            hederaTxHash: hederaTxHash,
            transactionType: transactionType,
            amount: amount
        });
        
        // Store transaction records
        sellerTransactions[seller].push(transaction);
        buyerTransactions[buyer].push(transaction);
        allTransactions.push(transaction);
        totalTransactions++;
        
        emit TransactionFinalizedMirror(
            buyer,
            seller,
            rating,
            block.timestamp,
            sourceChain,
            hederaTxHash,
            transactionType,
            amount
        );
    }
    
    /**
     * @dev Handle agent status changes from Hedera
     */
    function _handleAgentStatusChange(bytes memory data) internal {
        (
            address agent,
            bool isActive,
            string memory reason
        ) = abi.decode(data, (address, bool, string));
        
        require(isAgentRegistered[agent], "Agent not registered");
        
        agents[agent].isActive = isActive;
        agents[agent].lastUpdateTimestamp = block.timestamp;
        
        emit AgentStatusUpdated(agent, isActive, block.timestamp, reason);
    }
    
    // ==================== VIEW FUNCTIONS FOR THE GRAPH ====================
    
    /**
     * @dev Get complete agent information
     */
    function getAgentInfo(address agent) external view returns (AgentInfo memory) {
        return agents[agent];
    }
    
    /**
     * @dev Get agent reputation history
     */
    function getAgentReputationHistory(address agent) 
        external view returns (ReputationHistory[] memory) {
        return reputationHistory[agent];
    }
    
    /**
     * @dev Get transactions for seller
     */
    function getSellerTransactions(address seller) 
        external view returns (TransactionRecord[] memory) {
        return sellerTransactions[seller];
    }
    
    /**
     * @dev Get transactions for buyer
     */
    function getBuyerTransactions(address buyer) 
        external view returns (TransactionRecord[] memory) {
        return buyerTransactions[buyer];
    }
    
    /**
     * @dev Get all registered agents
     */
    function getAllAgents() external view returns (address[] memory) {
        return allAgents;
    }
    
    /**
     * @dev Get total count of agents by tag
     */
    function getAgentCountByType(string memory tag) external view returns (uint256) {
        return agentTypeCount[tag];
    }
    
    /**
     * @dev Get system statistics
     */
    function getSystemStats() external view returns (
        uint256 totalAgents,
        uint256 totalTxns,
        uint256 totalRepUpdates
    ) {
        totalAgents = totalAgentsRegistered;
        totalTxns = totalTransactions;
        
        // Calculate total reputation updates
        for (uint256 i = 0; i < allAgents.length; i++) {
            totalRepUpdates += reputationUpdateCount[allAgents[i]];
        }
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Update CCIP allowlists (admin only)
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
     * @dev Emergency pause/unpause agent (admin only)
     */
    function emergencySetAgentStatus(address agent, bool isActive, string memory reason) 
        external onlyOwner {
        require(isAgentRegistered[agent], "Agent not registered");
        
        agents[agent].isActive = isActive;
        agents[agent].lastUpdateTimestamp = block.timestamp;
        
        emit AgentStatusUpdated(agent, isActive, block.timestamp, reason);
    }
    
    // ==================== INTERNAL HELPERS ====================
    
    /**
     * @dev Update system statistics and emit event
     */
    function _updateStatistics() internal {
        uint256 totalRepUpdates = 0;
        for (uint256 i = 0; i < allAgents.length; i++) {
            totalRepUpdates += reputationUpdateCount[allAgents[i]];
        }
        
        emit StateStatisticsUpdated(
            totalAgentsRegistered,
            totalTransactions,
            totalRepUpdates
        );
    }
    
    // ==================== CHAINLINK CCIP RECEIVER REQUIREMENTS ====================
    
    /**
     * @dev Required by CCIPReceiver - validates message format
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
