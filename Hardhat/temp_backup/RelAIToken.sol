// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RelAIToken
 * @dev Governance token for RelAI DAO with voting capabilities
 * @notice This token is used for voting in the RelAI DAO governance system
 */
contract RelAIToken is ERC20, ERC20Votes, ERC20Permit, Ownable {
    
    // Total supply: 1 billion tokens with 18 decimals
    uint256 private constant _totalSupply = 1_000_000_000 * 10**18;
    
    // Token distribution allocations
    uint256 public constant COMMUNITY_ALLOCATION = 500_000_000 * 10**18; // 50%
    uint256 public constant DAO_TREASURY_ALLOCATION = 200_000_000 * 10**18; // 20%
    uint256 public constant TEAM_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant ECOSYSTEM_ALLOCATION = 100_000_000 * 10**18; // 10%
    uint256 public constant RESERVE_ALLOCATION = 50_000_000 * 10**18; // 5%
    
    // Vesting schedules
    mapping(address => uint256) public vestedAmounts;
    mapping(address => uint256) public vestedTimestamp;
    mapping(address => bool) public isVested;
    
    // Events for tracking token distribution
    event TokensVested(address indexed beneficiary, uint256 amount, uint256 vestingPeriod);
    event VestedTokensClaimed(address indexed beneficiary, uint256 amount);
    event CommunityRewardDistributed(address indexed recipient, uint256 amount, string reason);
    
    constructor(
        address initialOwner,
        address daoTreasury
    ) 
        ERC20("RelAI Governance Token", "RELAI") 
        ERC20Permit("RelAI Governance Token")
        Ownable(initialOwner)
    {
        // Mint tokens to contract for controlled distribution
        _mint(address(this), _totalSupply);
        
        // Immediately transfer DAO treasury allocation
        _transfer(address(this), daoTreasury, DAO_TREASURY_ALLOCATION);
        
        // Immediately transfer community allocation to owner for distribution
        _transfer(address(this), initialOwner, COMMUNITY_ALLOCATION);
    }
    
    /**
     * @dev Vest tokens for team members and advisors with time-based vesting
     * @param beneficiary Address to receive vested tokens
     * @param amount Amount of tokens to vest
     * @param vestingPeriod Vesting period in seconds
     */
    function vestTokens(
        address beneficiary, 
        uint256 amount, 
        uint256 vestingPeriod
    ) external onlyOwner {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be greater than 0");
        require(vestingPeriod > 0, "Vesting period must be greater than 0");
        require(!isVested[beneficiary], "Already has vested tokens");
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        vestedAmounts[beneficiary] = amount;
        vestedTimestamp[beneficiary] = block.timestamp + vestingPeriod;
        isVested[beneficiary] = true;
        
        emit TokensVested(beneficiary, amount, vestingPeriod);
    }
    
    /**
     * @dev Claim vested tokens after vesting period
     */
    function claimVestedTokens() external {
        require(isVested[msg.sender], "No vested tokens");
        require(block.timestamp >= vestedTimestamp[msg.sender], "Tokens still vesting");
        require(vestedAmounts[msg.sender] > 0, "No tokens to claim");
        
        uint256 amount = vestedAmounts[msg.sender];
        vestedAmounts[msg.sender] = 0;
        isVested[msg.sender] = false;
        
        _transfer(address(this), msg.sender, amount);
        
        emit VestedTokensClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Distribute community rewards for good behavior, contributions, etc.
     * @param recipient Address to receive reward
     * @param amount Amount of tokens to distribute
     * @param reason Reason for the reward
     */
    function distributeCommunityReward(
        address recipient, 
        uint256 amount, 
        string calldata reason
    ) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        require(bytes(reason).length > 0, "Reason required");
        
        _transfer(address(this), recipient, amount);
        
        emit CommunityRewardDistributed(recipient, amount, reason);
    }
    
    /**
     * @dev Batch distribute tokens to multiple recipients (for airdrops, etc.)
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of token amounts corresponding to recipients
     */
    function batchDistribute(
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(balanceOf(address(this)) >= totalAmount, "Insufficient contract balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Amount must be greater than 0");
            _transfer(address(this), recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Emergency function to withdraw remaining tokens (only owner)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount <= balanceOf(address(this)), "Insufficient balance");
        _transfer(address(this), to, amount);
    }
    
    /**
     * @dev Check how much time left for vesting
     * @param beneficiary Address to check vesting time for
     * @return timeLeft Time left in seconds, 0 if ready to claim
     */
    function getVestingTimeLeft(address beneficiary) external view returns (uint256 timeLeft) {
        if (!isVested[beneficiary]) {
            return 0;
        }
        
        if (block.timestamp >= vestedTimestamp[beneficiary]) {
            return 0;
        }
        
        return vestedTimestamp[beneficiary] - block.timestamp;
    }
    
    /**
     * @dev Get vesting information for an address
     * @param beneficiary Address to check
     * @return amount Amount of vested tokens
     * @return unlockTime Timestamp when tokens unlock
     * @return hasVestedTokens Whether the address has vested tokens
     */
    function getVestingInfo(address beneficiary) external view returns (
        uint256 amount,
        uint256 unlockTime,
        bool hasVestedTokens
    ) {
        return (
            vestedAmounts[beneficiary],
            vestedTimestamp[beneficiary],
            isVested[beneficiary]
        );
    }
    
    // Required overrides
    
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
