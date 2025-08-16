// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title RelAITimelock
 * @dev Timelock controller for RelAI DAO governance
 * @notice This contract adds a time delay to governance actions for security
 */
contract RelAITimelock is TimelockController {
    
    // Events for governance security
    event SecurityDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event EmergencyDelayBypass(bytes32 indexed id, address indexed target, string reason);
    
    // Emergency bypass capability for critical security issues
    mapping(bytes32 => bool) public emergencyBypass;
    address public emergencyCouncil;
    
    modifier onlyEmergencyCouncil() {
        require(msg.sender == emergencyCouncil, "Only emergency council");
        _;
    }
    
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin,
        address _emergencyCouncil
    ) TimelockController(minDelay, proposers, executors, admin) {
        emergencyCouncil = _emergencyCouncil;
    }
    
    /**
     * @dev Emergency bypass for critical security issues
     * @param id Operation ID to bypass
     * @param reason Reason for emergency bypass
     */
    function emergencyBypassDelay(
        bytes32 id, 
        string calldata reason
    ) external onlyEmergencyCouncil {
        require(isOperation(id), "Operation does not exist");
        require(!isOperationDone(id), "Operation already executed");
        require(bytes(reason).length > 0, "Reason required");
        
        emergencyBypass[id] = true;
        
        emit EmergencyDelayBypass(id, msg.sender, reason);
    }
    
    /**
     * @dev Override execute to check for emergency bypass
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata payload,
        bytes32 predecessor,
        bytes32 salt
    ) public payable override {
        bytes32 id = hashOperation(target, value, payload, predecessor, salt);
        
        // Check if emergency bypass is active
        if (emergencyBypass[id]) {
            require(isOperation(id), "Operation not scheduled");
            require(predecessor == bytes32(0) || isOperationDone(predecessor), "Missing dependency");
            
            _execute(target, value, payload);
            emit CallExecuted(id, 0, target, value, payload);
            
            // Clear emergency bypass
            emergencyBypass[id] = false;
            return;
        }
        
        // Normal execution path
        super.execute(target, value, payload, predecessor, salt);
    }
    
    /**
     * @dev Batch execute multiple operations (with emergency bypass support)
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 predecessor,
        bytes32 salt
    ) public payable override {
        bytes32 id = hashOperationBatch(targets, values, payloads, predecessor, salt);
        
        // Check if emergency bypass is active
        if (emergencyBypass[id]) {
            require(isOperation(id), "Operation not scheduled");
            require(predecessor == bytes32(0) || isOperationDone(predecessor), "Missing dependency");
            
            for (uint256 i = 0; i < targets.length; ++i) {
                address target = targets[i];
                uint256 value = values[i];
                bytes calldata payload = payloads[i];
                
                _execute(target, value, payload);
                emit CallExecuted(id, i, target, value, payload);
            }
            
            // Clear emergency bypass
            emergencyBypass[id] = false;
            return;
        }
        
        // Normal execution path
        super.executeBatch(targets, values, payloads, predecessor, salt);
    }
    
    /**
     * @dev Update emergency council address
     */
    function updateEmergencyCouncil(address newCouncil) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newCouncil != address(0), "Invalid council address");
        emergencyCouncil = newCouncil;
    }
    
    /**
     * @dev Check if operation has emergency bypass
     */
    function hasEmergencyBypass(bytes32 id) external view returns (bool) {
        return emergencyBypass[id];
    }
}
