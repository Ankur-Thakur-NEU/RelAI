// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MockAgentRegistry
 * @dev Mock implementation of AgentRegistry for testing DAO functionality
 * @notice This is a simplified version for development and testing purposes
 */
contract MockAgentRegistry is Ownable, ReentrancyGuard {
    
    struct Agent {
        address agentAddress;
        string name;
        string capabilities;
        int256 reputation;
        bool isRegistered;
        bool isBlacklisted;
        uint256 registrationTime;
        uint256 lastUpdate;
        string[] reports;
        string agentType; // Step 3: Agent type for classification
        bool isWhitelisted; // Step 3: Additional whitelist status
    }
    
    // Mappings
    mapping(address => Agent) public agents;
    mapping(address => bool) public authorizedUpdaters; // DAO and other authorized contracts
    
    // Arrays for iteration
    address[] public registeredAgents;
    
    // Events
    event AgentRegistered(
        address indexed agent,
        string name,
        string capabilities,
        uint256 timestamp
    );
    
    event ReputationUpdated(
        address indexed agent,
        int256 oldReputation,
        int256 newReputation,
        int256 delta,
        address indexed updater,
        uint256 timestamp
    );
    
    event AgentReported(
        address indexed agent,
        address indexed reporter,
        string evidence,
        uint256 timestamp
    );
    
    event AgentBlacklisted(
        address indexed agent,
        bool blacklisted,
        address indexed updater,
        uint256 timestamp
    );
    
    event ReputationSlashed(
        address indexed agent,
        uint256 amount,
        address indexed slasher,
        uint256 timestamp
    );
    
    event AuthorizedUpdaterChanged(
        address indexed updater,
        bool authorized,
        uint256 timestamp
    );
    
    event AgentUpdated(
        address indexed agent,
        string field,
        string oldValue,
        string newValue,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyAuthorizedUpdater() {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "Not authorized to update"
        );
        _;
    }
    
    modifier onlyRegisteredAgent(address agent) {
        require(agents[agent].isRegistered, "Agent not registered");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Contract deployer is initially authorized
        authorizedUpdaters[msg.sender] = true;
    }
    
    /**
     * @dev Register a new agent
     * @param name Agent name/identifier
     * @param capabilities Description of agent capabilities
     */
    function registerAgent(
        string calldata name,
        string calldata capabilities
    ) external {
        require(!agents[msg.sender].isRegistered, "Agent already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(capabilities).length > 0, "Capabilities cannot be empty");
        
        agents[msg.sender] = Agent({
            agentAddress: msg.sender,
            name: name,
            capabilities: capabilities,
            reputation: 1000, // Starting reputation
            isRegistered: true,
            isBlacklisted: false,
            registrationTime: block.timestamp,
            lastUpdate: block.timestamp,
            reports: new string[](0),
            agentType: "default", // Default agent type
            isWhitelisted: false // Default not whitelisted
        });
        
        registeredAgents.push(msg.sender);
        
        emit AgentRegistered(msg.sender, name, capabilities, block.timestamp);
    }
    
    /**
     * @dev Register a new agent with type specification (Step 3)
     * @param name Agent name/identifier
     * @param capabilities Description of agent capabilities
     * @param agentType Type of agent (e.g., "hedera_evm", "ai_agent", "automation")
     */
    function registerAgentWithType(
        string calldata name,
        string calldata capabilities,
        string calldata agentType
    ) external {
        require(!agents[msg.sender].isRegistered, "Agent already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(capabilities).length > 0, "Capabilities cannot be empty");
        require(bytes(agentType).length > 0, "Agent type cannot be empty");
        
        agents[msg.sender] = Agent({
            agentAddress: msg.sender,
            name: name,
            capabilities: capabilities,
            reputation: 1000, // Starting reputation
            isRegistered: true,
            isBlacklisted: false,
            registrationTime: block.timestamp,
            lastUpdate: block.timestamp,
            reports: new string[](0),
            agentType: agentType,
            isWhitelisted: false
        });
        
        registeredAgents.push(msg.sender);
        
        emit AgentRegistered(msg.sender, name, capabilities, block.timestamp);
    }
    
    /**
     * @dev Update agent reputation (called by DAO)
     * @param agent Address of the agent
     * @param delta Reputation change (positive or negative)
     */
    function updateReputation(
        address agent,
        int256 delta
    ) external onlyAuthorizedUpdater onlyRegisteredAgent(agent) {
        int256 oldReputation = agents[agent].reputation;
        agents[agent].reputation += delta;
        agents[agent].lastUpdate = block.timestamp;
        
        emit ReputationUpdated(
            agent,
            oldReputation,
            agents[agent].reputation,
            delta,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Report malicious behavior
     * @param agent Address of the agent to report
     * @param evidence Evidence of malicious behavior
     */
    function reportMalicious(
        address agent,
        string calldata evidence
    ) external onlyAuthorizedUpdater onlyRegisteredAgent(agent) {
        require(bytes(evidence).length > 0, "Evidence required");
        
        agents[agent].reports.push(evidence);
        agents[agent].lastUpdate = block.timestamp;
        
        emit AgentReported(agent, msg.sender, evidence, block.timestamp);
    }
    
    /**
     * @dev Slash reputation (more severe than regular update)
     * @param agent Address of the agent
     * @param amount Amount to slash
     */
    function slashReputation(
        address agent,
        uint256 amount
    ) external onlyAuthorizedUpdater onlyRegisteredAgent(agent) {
        require(amount > 0, "Slash amount must be positive");
        
        int256 oldReputation = agents[agent].reputation;
        agents[agent].reputation -= int256(amount);
        agents[agent].lastUpdate = block.timestamp;
        
        emit ReputationSlashed(agent, amount, msg.sender, block.timestamp);
        emit ReputationUpdated(
            agent,
            oldReputation,
            agents[agent].reputation,
            -int256(amount),
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Blacklist/unblacklist an agent
     * @param agent Address of the agent
     * @param blacklisted Whether to blacklist or unblacklist
     */
    function blacklistAgent(
        address agent,
        bool blacklisted
    ) external onlyAuthorizedUpdater onlyRegisteredAgent(agent) {
        agents[agent].isBlacklisted = blacklisted;
        agents[agent].lastUpdate = block.timestamp;
        
        emit AgentBlacklisted(agent, blacklisted, msg.sender, block.timestamp);
    }
    
    // Administrative functions
    
    /**
     * @dev Authorize or revoke updater permissions (for DAO contract)
     * @param updater Address to authorize/revoke
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedUpdater(
        address updater,
        bool authorized
    ) external onlyOwner {
        require(updater != address(0), "Invalid updater address");
        
        authorizedUpdaters[updater] = authorized;
        
        emit AuthorizedUpdaterChanged(updater, authorized, block.timestamp);
    }
    
    // View functions
    
    /**
     * @dev Get agent reputation
     * @param agent Address of the agent
     * @return reputation Current reputation score
     */
    function getAgentReputation(address agent) external view returns (int256) {
        return agents[agent].reputation;
    }
    
    /**
     * @dev Check if agent is registered
     * @param agent Address of the agent
     * @return isRegistered Whether the agent is registered
     */
    function isAgentRegistered(address agent) external view returns (bool) {
        return agents[agent].isRegistered;
    }
    
    /**
     * @dev Check if agent is blacklisted
     * @param agent Address of the agent
     * @return isBlacklisted Whether the agent is blacklisted
     */
    function isAgentBlacklisted(address agent) external view returns (bool) {
        return agents[agent].isBlacklisted;
    }
    
    /**
     * @dev Get complete agent information
     * @param agent Address of the agent
     * @return agentInfo Complete agent struct
     */
    function getAgentInfo(address agent) external view returns (Agent memory) {
        return agents[agent];
    }
    
    // ==================== STEP 3: NEW INTERFACE FUNCTIONS ====================
    
    /**
     * @dev Check if agent is registered (alias for isAgentRegistered)
     * @param agent Address to check
     */
    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].isRegistered;
    }
    
    /**
     * @dev Get agent type
     * @param agent Address of the agent
     */
    function getAgentType(address agent) external view returns (string memory) {
        require(agents[agent].isRegistered, "Agent not registered");
        return agents[agent].agentType;
    }
    
    /**
     * @dev Check if agent is whitelisted in registry
     * @param agent Address to check
     */
    function isAgentWhitelisted(address agent) external view returns (bool) {
        return agents[agent].isWhitelisted;
    }
    
    /**
     * @dev Set agent type (only owner or authorized updaters)
     * @param agent Address of the agent
     * @param newType New agent type
     */
    function setAgentType(address agent, string calldata newType) external {
        require(
            msg.sender == owner() || authorizedUpdaters[msg.sender], 
            "Not authorized to update agent type"
        );
        require(agents[agent].isRegistered, "Agent not registered");
        require(bytes(newType).length > 0, "Agent type cannot be empty");
        
        string memory oldType = agents[agent].agentType;
        agents[agent].agentType = newType;
        agents[agent].lastUpdate = block.timestamp;
        
        emit AgentUpdated(agent, "type", oldType, newType, block.timestamp);
    }
    
    /**
     * @dev Set agent whitelist status (only owner or authorized updaters)
     * @param agent Address of the agent
     * @param whitelisted Whether agent should be whitelisted
     */
    function setAgentWhitelist(address agent, bool whitelisted) external {
        require(
            msg.sender == owner() || authorizedUpdaters[msg.sender], 
            "Not authorized to update whitelist"
        );
        require(agents[agent].isRegistered, "Agent not registered");
        
        agents[agent].isWhitelisted = whitelisted;
        agents[agent].lastUpdate = block.timestamp;
        
        emit AgentUpdated(
            agent, 
            "whitelist", 
            whitelisted ? "false" : "true", 
            whitelisted ? "true" : "false", 
            block.timestamp
        );
    }
    
    // ==================== END STEP 3: NEW INTERFACE FUNCTIONS ====================
    
    /**
     * @dev Get all registered agents
     * @return agents Array of registered agent addresses
     */
    function getAllRegisteredAgents() external view returns (address[] memory) {
        return registeredAgents;
    }
    
    /**
     * @dev Get agent reports
     * @param agent Address of the agent
     * @return reports Array of report evidence strings
     */
    function getAgentReports(address agent) external view returns (string[] memory) {
        return agents[agent].reports;
    }
    
    /**
     * @dev Get total number of registered agents
     * @return count Total count of registered agents
     */
    function getRegisteredAgentCount() external view returns (uint256) {
        return registeredAgents.length;
    }
    
    /**
     * @dev Check if address is authorized updater
     * @param updater Address to check
     * @return authorized Whether the address is authorized
     */
    function isAuthorizedUpdater(address updater) external view returns (bool) {
        return authorizedUpdaters[updater];
    }
    
    /**
     * @dev Get agents with reputation above threshold
     * @param threshold Minimum reputation threshold
     * @return goodAgents Array of agent addresses with good reputation
     */
    function getAgentsAboveThreshold(int256 threshold) external view returns (address[] memory) {
        uint256 count = 0;
        
        // First pass: count qualifying agents
        for (uint256 i = 0; i < registeredAgents.length; i++) {
            if (agents[registeredAgents[i]].reputation >= threshold && 
                !agents[registeredAgents[i]].isBlacklisted) {
                count++;
            }
        }
        
        // Second pass: populate result array
        address[] memory goodAgents = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < registeredAgents.length; i++) {
            if (agents[registeredAgents[i]].reputation >= threshold && 
                !agents[registeredAgents[i]].isBlacklisted) {
                goodAgents[index] = registeredAgents[i];
                index++;
            }
        }
        
        return goodAgents;
    }
}
