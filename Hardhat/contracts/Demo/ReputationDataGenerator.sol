// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ReputationDataGenerator  
 * @dev Demo contract to generate realistic reputation data for subgraph testing
 * @notice This contract emits the same events as ReputationMirror for hackathon demo
 */
contract ReputationDataGenerator {
    // Events matching ReputationMirror for subgraph indexing
    event AgentRegistered(address indexed agent, string tag);
    event TransactionFinalized(
        address indexed buyer,
        address indexed seller,
        string x402Ref,
        int8 rating
    );
    event ReputationUpdated(
        address indexed seller,
        string x402Ref,
        uint16 oldRep,
        uint16 newRep
    );
    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        bytes data
    );

    address public owner;
    uint256 public agentCount;
    uint256 public transactionCount;

    // Pre-defined AI agent addresses
    address constant AI_AGENT_1 = 0x1111111111111111111111111111111111111111;
    address constant AI_AGENT_2 = 0x2222222222222222222222222222222222222222;
    address constant AI_AGENT_3 = 0x3333333333333333333333333333333333333333;
    address constant AI_AGENT_4 = 0x4444444444444444444444444444444444444444;
    address constant AI_AGENT_5 = 0x5555555555555555555555555555555555555555;
    
    // Buyer addresses
    address constant BUYER_1 = 0x0000000000000000000000000000000000000001;
    address constant BUYER_2 = 0x0000000000000000000000000000000000000002;
    address constant BUYER_3 = 0x0000000000000000000000000000000000000003;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @dev Generate AI agent registration data
     */
    function generateAIAgents() external onlyOwner {
        address[5] memory aiAgents = [AI_AGENT_1, AI_AGENT_2, AI_AGENT_3, AI_AGENT_4, AI_AGENT_5];
        string[5] memory aiTags = ["GPT-Trading-Bot", "DeFi-Yield-Optimizer", "NFT-Price-Predictor", "Cross-Chain-Arbitrage", "Risk-Assessment-AI"];
        uint16[5] memory initialReps = [uint16(85), 92, 78, 95, 88];
        
        for (uint i = 0; i < 5; i++) {
            emit AgentRegistered(aiAgents[i], aiTags[i]);
            emit ReputationUpdated(aiAgents[i], "", 0, initialReps[i]);
            agentCount++;
            
            // Simulate cross-chain message for registration
            bytes32 messageId = keccak256(abi.encodePacked(aiAgents[i], block.timestamp, i));
            bytes memory messageData = abi.encodePacked(
                uint8(1), // command = register
                abi.encode(aiAgents[i], aiTags[i], initialReps[i])
            );
            
            emit MessageReceived(
                messageId,
                222782988166878823, // Hedera testnet chain selector
                0x2b62128E7ad12d9C437f89c1be66B00e9d000d94, // ReputationManager
                messageData
            );
        }
    }

    /**
     * @dev Generate realistic AI agent transactions and ratings
     */
    function generateAITransactions() external onlyOwner {
        address[5] memory aiAgents = [AI_AGENT_1, AI_AGENT_2, AI_AGENT_3, AI_AGENT_4, AI_AGENT_5];
        address[3] memory buyers = [BUYER_1, BUYER_2, BUYER_3];
        
        string[10] memory txRefs = [
            "AI_TRADE_001", "YIELD_OPT_002", "NFT_PRED_003", "ARBITRAGE_004", "RISK_ASSESS_005",
            "AI_TRADE_006", "DEFI_SWAP_007", "CROSS_CHAIN_008", "PREDICTION_009", "OPTIMIZATION_010"
        ];
        
        int8[10] memory ratings = [int8(4), 5, 3, 5, 4, 2, 5, 4, 3, 5];
        uint16[10] memory oldReps = [uint16(85), 92, 78, 95, 88, 87, 97, 81, 98, 92];
        
        for (uint i = 0; i < 10; i++) {
            address seller = aiAgents[i % 5];
            address buyer = buyers[i % 3];
            
            // Calculate new reputation based on rating
            uint16 oldRep = oldReps[i];
            uint16 newRep = oldRep;
            if (ratings[i] >= 4) {
                newRep += 2;
            } else if (ratings[i] >= 3) {
                newRep += 1;
            } else if (newRep > 1) {
                newRep -= 1;
            }
            
            emit TransactionFinalized(buyer, seller, txRefs[i], ratings[i]);
            emit ReputationUpdated(seller, txRefs[i], oldRep, newRep);
            transactionCount++;
            
            // Simulate cross-chain message for transaction
            bytes32 messageId = keccak256(abi.encodePacked(seller, buyer, i, block.timestamp));
            bytes memory messageData = abi.encodePacked(
                uint8(2), // command = finalize transaction
                abi.encode(buyer, seller, oldRep, txRefs[i], newRep)
            );
            
            emit MessageReceived(
                messageId,
                222782988166878823, // Hedera testnet chain selector
                0x2b62128E7ad12d9C437f89c1be66B00e9d000d94, // ReputationManager
                messageData
            );
        }
    }

    /**
     * @dev Get demo statistics
     */
    function getDemoStats() external view returns (uint256 agents, uint256 transactions) {
        return (agentCount, transactionCount);
    }
}
