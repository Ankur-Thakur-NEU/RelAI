// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReputationManager {
    struct Agent {
        string tag;
        uint8 reputation;
        bool exists;
    }

    mapping(address => Agent) private agents;
    address[] private agentList;

    event AgentRegistered(address indexed agent, string tag, uint8 reputation);
    event ReputationUpdated(address indexed agent, string x402Ref, uint8 oldReputation, uint8 newReputation);
    event TransactionFinalized(address indexed buyer, address indexed seller, string x402Ref, int8 rating);

    modifier onlyRegistered(address agent) {
        require(agents[agent].exists, "Agent not registered");
        _;
    }

    modifier validReputation(uint8 reputation) {
        require(reputation >= 1 && reputation <= 100, "Reputation must be [1;100]");
        _;
    }

    function registerAgent(
        address agentAddress,
        string calldata tag,
        uint8 reputation
    ) external validReputation(reputation) {
        require(!agents[agentAddress].exists, "Agent already registered");
        agents[agentAddress] = Agent(tag, reputation, true);
        agentList.push(agentAddress);
        emit AgentRegistered(agentAddress, tag, reputation);
    }

    function getAgent(address agentAddress)
        external
        view
        onlyRegistered(agentAddress)
        returns (string memory tag, uint8 reputation)
    {
        Agent storage ag = agents[agentAddress];
        return (ag.tag, ag.reputation);
    }

    /// @notice Finalize a transaction, rate seller, and update their reputation
    /// @param seller Address of the seller (must be registered)
    /// @param rating Value between -3 and 3
    /// @param x402Ref External transaction reference (string)
    function finalizeTransaction(
        address seller,
        int8 rating,
        string calldata x402Ref
    ) external onlyRegistered(msg.sender) onlyRegistered(seller) {
        require(rating >= -3 && rating <= 3, "rating out of range");
        require(seller != msg.sender, "self rating not allowed");

        uint8 oldRep = agents[seller].reputation;

        // update rep
        int256 newVal = int256(uint256(oldRep)) + int256(rating);
        if (newVal < 1) newVal = 1;
        if (newVal > 100) newVal = 100;

        uint8 newRep = uint8(uint256(newVal));
        agents[seller].reputation = newRep;

        emit TransactionFinalized(msg.sender, seller, x402Ref, rating);
        emit ReputationUpdated(seller, x402Ref, oldRep, newRep);
    }
}