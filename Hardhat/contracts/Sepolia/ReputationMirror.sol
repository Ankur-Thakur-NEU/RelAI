// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @notice Example Reputation Manager contract that demonstrates cross-chain messaging via Chainlink CCIP.
 * @dev This contract is provided for demonstration purposes only. 
 *      It uses simplified logic and un-audited code.
 *      DO NOT USE THIS CODE IN PRODUCTION.
 */

/// @title ReputationManager - A CCIP-enabled contract for managing agent reputation across chains
contract ReputationMirror is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    // Constants
    uint64 public constant DEST_SELECTOR_HEDERA = 222782988166878823;

    // State variables
    address public destinationReceiver;
    mapping(address => uint16) public reputation; // Reputation scores, 0 = unregistered sentinel

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

    // Chainlink CCIP fee token
    IERC20 private s_linkToken;

    // CCIP state
    bytes32 private s_lastReceivedMessageId;
    bytes private s_lastReceivedData;

    // Access control mappings
    mapping(uint64 => bool) public allowlistedDestinationChains;
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error DestinationChainNotAllowlisted(uint64 destinationChainSelector);
    error SourceChainNotAllowlisted(uint64 sourceChainSelector);
    error SenderNotAllowlisted(address sender);
    error InvalidReceiverAddress();

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        bytes data,
        address feeToken,
        uint256 fees
    );

    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        bytes data
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    /// @notice Initialize contract with CCIP router and LINK token addresses
    constructor(address _router, address _link) CCIPReceiver(_router) {
        s_linkToken = IERC20(_link);
        allowlistedDestinationChains[DEST_SELECTOR_HEDERA] = true;
    }

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------
    modifier onlyAllowlistedDestinationChain(uint64 _destinationChainSelector) {
        if (!allowlistedDestinationChains[_destinationChainSelector])
            revert DestinationChainNotAllowlisted(_destinationChainSelector);
        _;
    }

    modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender) {
        if (!allowlistedSourceChains[_sourceChainSelector])
            revert SourceChainNotAllowlisted(_sourceChainSelector);
        if (!allowlistedSenders[_sender]) revert SenderNotAllowlisted(_sender);
        _;
    }

    modifier validateReceiver(address _receiver) {
        if (_receiver == address(0)) revert InvalidReceiverAddress();
        _;
    }

    // -------------------------------------------------------------------------
    // Admin functions
    // -------------------------------------------------------------------------
    function setDestinationReceiver(address _receiver) external onlyOwner {
        require(_receiver != address(0), "invalid receiver");
        destinationReceiver = _receiver;
    }

    function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external onlyOwner {
        allowlistedDestinationChains[_destinationChainSelector] = allowed;
    }

    function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }

    // -------------------------------------------------------------------------
    // Cross-chain Messaging
    // -------------------------------------------------------------------------
    /// @dev Send CCIP message, always paying fees in LINK
    function _sendCCIPLink(
        uint64 destinationChainSelector,
        address receiver,
        bytes memory data
    ) internal returns (bytes32 messageId) {
        require(receiver != address(0), "invalid receiver");
        require(destinationReceiver != address(0), "destination not set");

        if (!allowlistedDestinationChains[destinationChainSelector]) {
            revert DestinationChainNotAllowlisted(destinationChainSelector);
        }

        // Build message with LINK as fee token
        Client.EVM2AnyMessage memory m = _buildCCIPMessage(receiver, data, address(s_linkToken));
        IRouterClient router = IRouterClient(getRouter());

        uint256 fees = router.getFee(destinationChainSelector, m);
        uint256 bal = s_linkToken.balanceOf(address(this));
        if (fees > bal) revert NotEnoughBalance(bal, fees);

        // Safe approve
        s_linkToken.safeApprove(address(router), 0);
        s_linkToken.safeApprove(address(router), fees);

        messageId = router.ccipSend(destinationChainSelector, m);

        emit MessageSent(messageId, destinationChainSelector, receiver, data, address(s_linkToken), fees);
    }

    /// @dev Handle a received CCIP message
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage)
        internal
        override
        onlyAllowlisted(
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address))
        )
    {
        s_lastReceivedMessageId = any2EvmMessage.messageId;
        s_lastReceivedData = any2EvmMessage.data;

		uint8 command = uint8(any2EvmMessage.data[0]);
		bytes memory rest = new bytes(any2EvmMessage.data.length - 1);
		for (uint i = 1; i < any2EvmMessage.data.length; i++) {
			rest[i - 1] = any2EvmMessage.data[i];
		}

		if (command == 1) {
			(address agent, string memory tag, uint16 initRep) = abi.decode(rest, (address,string,uint16));

			reputation[agent] = initRep;

			emit AgentRegistered(agent, tag);
    		emit ReputationUpdated(agent, "", 0, initRep);
		} else if (command == 2) {
			(address buyer, address seller, uint16 oldRep, string memory x402Ref, uint16 newRep) =
        		abi.decode(rest, (address,address,uint16,string,uint16));

			reputation[seller] = newRep;

			emit TransactionFinalized(buyer, seller, x402Ref, int8(int16(newRep) - int16(oldRep)));
    		emit ReputationUpdated(seller, x402Ref, oldRep, newRep);
		}

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            any2EvmMessage.data
        );
    }

    /// @dev Build CCIP EVM2AnyMessage
    function _buildCCIPMessage(
        address _receiver,
        bytes memory _data,
        address _feeTokenAddress
    ) private pure returns (Client.EVM2AnyMessage memory) {
        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: _data,
            tokenAmounts: new Client.EVMTokenAmount[](0) ,
            extraArgs: Client._argsToBytes(
                Client.GenericExtraArgsV2({
                    gasLimit: 200_000,
                    allowOutOfOrderExecution: true
                })
            ),
            feeToken: _feeTokenAddress
        });
    }

	function sendDAOUpdate(
		address agent,
		uint16 newRep
	) external onlyOwner {
		require(reputation[agent] != 0, "agent not registered"); // optional check

		uint16 oldRep = reputation[agent];
		reputation[agent] = newRep;

		// Build a payload that the Hedera mirror will decode as (address, uint16)
		bytes memory payload = abi.encode(agent, newRep);

		// Send to Hedera
		_sendCCIPLink(DEST_SELECTOR_HEDERA, destinationReceiver, payload);

		emit ReputationUpdated(agent, "", oldRep, newRep);
	}

    // -------------------------------------------------------------------------
    // Utility
    // -------------------------------------------------------------------------
    function getLastReceivedMessageDetails() external view returns (bytes32 messageId, bytes memory data) {
        return (s_lastReceivedMessageId, s_lastReceivedData);
    }

    receive() external payable {}

    function withdraw(address _beneficiary) public onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();

        (bool sent, ) = _beneficiary.call{value: amount}("");
        if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
    }

    function withdrawToken(address _beneficiary, address _token) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        if (amount == 0) revert NothingToWithdraw();

        IERC20(_token).safeTransfer(_beneficiary, amount);
    }
}
