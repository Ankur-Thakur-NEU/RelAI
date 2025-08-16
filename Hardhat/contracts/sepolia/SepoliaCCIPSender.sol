// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SepoliaCCIPSender
 * @dev Handles sending DAO governance decisions to Hedera via CCIP
 * @notice Used by SepoliaDAO to execute cross-chain governance actions
 */
contract SepoliaCCIPSender is Ownable {
    using SafeERC20 for IERC20;
    
    // ==================== STRUCTS ====================
    
    struct MessageConfig {
        uint64 destinationChainSelector;
        address receiver;
        address feeToken;
        uint256 gasLimit;
    }
    
    // ==================== STATE VARIABLES ====================
    
    IRouterClient private immutable i_router;
    mapping(uint64 => MessageConfig) public chainConfigs;
    mapping(address => bool) public authorizedCallers; // DAO contracts that can send messages
    
    uint64 public hederaChainSelector;
    address public hederaReceiver;
    
    // Message tracking
    mapping(bytes32 => bool) public sentMessages;
    uint256 public totalMessagesSent;
    
    // ==================== EVENTS ====================
    
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed receiver,
        string messageType,
        bytes data,
        address feeToken,
        uint256 fees
    );
    
    event ReputationOverrideSent(
        bytes32 indexed messageId,
        address indexed targetAgent,
        int256 newReputation,
        uint256 proposalId
    );
    
    event ChainConfigUpdated(
        uint64 indexed chainSelector,
        address receiver,
        address feeToken,
        uint256 gasLimit
    );
    
    event AuthorizedCallerUpdated(
        address indexed caller,
        bool authorized
    );
    
    // ==================== ERRORS ====================
    
    error UnauthorizedCaller();
    error InvalidChainConfig();
    error InsufficientFeeTokenBalance();
    error MessageSendFailed();
    error InvalidAddress();
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        address _router,
        uint64 _hederaChainSelector,
        address _hederaReceiver,
        address _feeToken
    ) Ownable(msg.sender) {
        if (_router == address(0) || _hederaReceiver == address(0)) {
            revert InvalidAddress();
        }
        
        i_router = IRouterClient(_router);
        hederaChainSelector = _hederaChainSelector;
        hederaReceiver = _hederaReceiver;
        
        // Set default Hedera config
        chainConfigs[_hederaChainSelector] = MessageConfig({
            destinationChainSelector: _hederaChainSelector,
            receiver: _hederaReceiver,
            feeToken: _feeToken,
            gasLimit: 200000 // Default gas limit
        });
    }
    
    // ==================== MODIFIERS ====================
    
    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }
        _;
    }
    
    // ==================== MAIN FUNCTIONS ====================
    
    /**
     * @dev Send reputation override to Hedera (called by DAO)
     * @param targetAgent Agent whose reputation to override
     * @param newReputation New reputation value to set
     * @param proposalId Associated DAO proposal ID
     */
    function sendReputationOverride(
        address targetAgent,
        int256 newReputation,
        uint256 proposalId
    ) external onlyAuthorized returns (bytes32 messageId) {
        if (targetAgent == address(0)) {
            revert InvalidAddress();
        }
        
        MessageConfig memory config = chainConfigs[hederaChainSelector];
        if (config.receiver == address(0)) {
            revert InvalidChainConfig();
        }
        
        // Encode message data
        bytes memory data = abi.encode(
            "DAO_REPUTATION_OVERRIDE",
            abi.encode(targetAgent, newReputation, proposalId, block.timestamp)
        );
        
        // Build CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(config.receiver),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: config.gasLimit})
            ),
            feeToken: config.feeToken
        });
        
        // Calculate and pay fees
        uint256 fees = i_router.getFee(config.destinationChainSelector, message);
        
        if (config.feeToken == address(0)) {
            // Pay with native token
            if (address(this).balance < fees) {
                revert InsufficientFeeTokenBalance();
            }
        } else {
            // Pay with ERC20 token
            IERC20(config.feeToken).safeTransferFrom(msg.sender, address(this), fees);
            IERC20(config.feeToken).approve(address(i_router), fees);
        }
        
        // Send message
        try i_router.ccipSend{value: config.feeToken == address(0) ? fees : 0}(
            config.destinationChainSelector,
            message
        ) returns (bytes32 _messageId) {
            messageId = _messageId;
            sentMessages[messageId] = true;
            totalMessagesSent++;
            
            emit MessageSent(
                messageId,
                config.destinationChainSelector,
                config.receiver,
                "DAO_REPUTATION_OVERRIDE",
                data,
                config.feeToken,
                fees
            );
            
            emit ReputationOverrideSent(
                messageId,
                targetAgent,
                newReputation,
                proposalId
            );
            
        } catch {
            revert MessageSendFailed();
        }
    }
    
    /**
     * @dev Send generic DAO decision to Hedera
     * @param messageType Type of DAO decision
     * @param data Encoded decision data
     */
    function sendDAODecision(
        string memory messageType,
        bytes memory data
    ) external onlyAuthorized returns (bytes32 messageId) {
        MessageConfig memory config = chainConfigs[hederaChainSelector];
        if (config.receiver == address(0)) {
            revert InvalidChainConfig();
        }
        
        // Encode message
        bytes memory messageData = abi.encode(messageType, data);
        
        // Build CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(config.receiver),
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: config.gasLimit})
            ),
            feeToken: config.feeToken
        });
        
        // Calculate fees
        uint256 fees = i_router.getFee(config.destinationChainSelector, message);
        
        if (config.feeToken == address(0)) {
            if (address(this).balance < fees) {
                revert InsufficientFeeTokenBalance();
            }
        } else {
            IERC20(config.feeToken).safeTransferFrom(msg.sender, address(this), fees);
            IERC20(config.feeToken).approve(address(i_router), fees);
        }
        
        // Send message
        try i_router.ccipSend{value: config.feeToken == address(0) ? fees : 0}(
            config.destinationChainSelector,
            message
        ) returns (bytes32 _messageId) {
            messageId = _messageId;
            sentMessages[messageId] = true;
            totalMessagesSent++;
            
            emit MessageSent(
                messageId,
                config.destinationChainSelector,
                config.receiver,
                messageType,
                messageData,
                config.feeToken,
                fees
            );
            
        } catch {
            revert MessageSendFailed();
        }
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get message fee estimate
     */
    function getMessageFee(
        string memory messageType,
        bytes memory data
    ) external view returns (uint256) {
        MessageConfig memory config = chainConfigs[hederaChainSelector];
        if (config.receiver == address(0)) {
            revert InvalidChainConfig();
        }
        
        bytes memory messageData = abi.encode(messageType, data);
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(config.receiver),
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: config.gasLimit})
            ),
            feeToken: config.feeToken
        });
        
        return i_router.getFee(config.destinationChainSelector, message);
    }
    
    /**
     * @dev Check if message was sent
     */
    function isMessageSent(bytes32 messageId) external view returns (bool) {
        return sentMessages[messageId];
    }
    
    /**
     * @dev Get chain configuration
     */
    function getChainConfig(uint64 chainSelector) external view returns (MessageConfig memory) {
        return chainConfigs[chainSelector];
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Update chain configuration
     */
    function updateChainConfig(
        uint64 chainSelector,
        address receiver,
        address feeToken,
        uint256 gasLimit
    ) external onlyOwner {
        if (receiver == address(0)) {
            revert InvalidAddress();
        }
        
        chainConfigs[chainSelector] = MessageConfig({
            destinationChainSelector: chainSelector,
            receiver: receiver,
            feeToken: feeToken,
            gasLimit: gasLimit
        });
        
        // Update main Hedera config if applicable
        if (chainSelector == hederaChainSelector) {
            hederaReceiver = receiver;
        }
        
        emit ChainConfigUpdated(chainSelector, receiver, feeToken, gasLimit);
    }
    
    /**
     * @dev Authorize/deauthorize caller (DAO contracts)
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }
    
    /**
     * @dev Withdraw fee tokens (emergency)
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Withdraw ETH
            payable(owner()).transfer(amount);
        } else {
            // Withdraw ERC20
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    /**
     * @dev Fund contract for fees
     */
    function fundForFees() external payable onlyOwner {
        // Allow owner to fund contract with ETH for fees
    }
    
    // ==================== RECEIVE FUNCTION ====================
    
    /**
     * @dev Allow contract to receive ETH for fees
     */
    receive() external payable {
        // Contract can receive ETH for CCIP fees
    }
}
