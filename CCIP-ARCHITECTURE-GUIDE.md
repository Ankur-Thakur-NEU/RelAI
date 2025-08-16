# 🌉 RelAI Cross-Chain DAO Architecture Guide

## 📋 Overview

This guide explains the complete **two-way CCIP architecture** for the RelAI Decentralized Cross-Chain Reputation Registry. The system enables:

- **Sepolia** as the main governance hub (DAO decisions)
- **Hedera** as the execution layer (agent transactions and registrations)  
- **Bi-directional state synchronization** via Chainlink CCIP

## 🏗️ Architecture Components

### **Sepolia Chain (Governance Hub)**
```
┌─────────────────────────────────────┐
│             SEPOLIA                 │
├─────────────────────────────────────┤
│ • SepoliaDAO.sol                   │ ← Main DAO governance
│ • SepoliaCCIPSender.sol            │ ← Sends decisions to Hedera
│ • SepoliaStateMirror.sol           │ ← Receives Hedera state updates
│ • RelAIToken.sol (Governance)      │ ← Voting token
│ • RelAITimelock.sol                │ ← Execution delays
└─────────────────────────────────────┘
```

### **Hedera Chain (Execution Layer)**
```
┌─────────────────────────────────────┐
│             HEDERA                  │
├─────────────────────────────────────┤
│ • HederaCCIPHandler.sol             │ ← Receives DAO decisions
│ • AgentDAOCore.sol / Registry       │ ← Agent management
│ • HederaCCIPSender.sol              │ ← Sends updates to Sepolia
│ • AgentCCIPIntegrator.sol           │ ← Helper for existing contracts
└─────────────────────────────────────┘
```

### **CCIP Message Flow**
```
Sepolia DAO Decision  ──CCIP──→  Hedera Execution
                               ↗
Agent Registration    ──CCIP──→  Sepolia State Mirror
Transaction Complete  ──CCIP──→  (for Graph indexing)
Reputation Updates    ──CCIP──→
                               ↘
                    Hedera Contract Events
```

## 🚀 Deployment Steps

### **Step 1: Deploy Sepolia Contracts**

```bash
# Configure environment
echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY" >> .env
echo "PRIVATE_KEY=your_private_key_here" >> .env

# Deploy Sepolia DAO system
npx hardhat run scripts/deploy-sepolia-dao.js --network sepolia
```

**Deployed Contracts:**
- ✅ RelAI Governance Token
- ✅ RelAI Timelock Controller
- ✅ Sepolia DAO (main governance)
- ✅ Sepolia CCIP Sender
- ✅ Sepolia State Mirror

### **Step 2: Deploy Hedera Contracts**

```bash
# Update .env with Hedera config
echo "HEDERA_PRIVATE_KEY=your_hedera_private_key" >> .env
echo "HEDERA_EVM_ADDRESS=your_hedera_evm_address" >> .env

# Deploy Hedera CCIP integration
npx hardhat run scripts/deploy-hedera-ccip.js --network hederaTestnet
```

**Deployed Contracts:**
- ✅ Hedera CCIP Handler
- ✅ Hedera CCIP Sender  
- ✅ Agent CCIP Integrator (helper)

### **Step 3: Configure Cross-Chain Communication**

```bash
# Update CCIP configurations with actual addresses
npx hardhat run scripts/configure-ccip.js
```

## 📖 How to Use Each Contract

### **1. SepoliaDAO.sol - Main Governance**

#### **Creating Reputation Override Proposals**
```solidity
// Propose to override an agent's reputation
function proposeReputationOverride(
    address agent,           // Agent's address
    int256 newReputation,    // New reputation value  
    string memory reason     // Governance reason
) external returns (uint256 proposalId)

// Example usage:
dao.proposeReputationOverride(
    0x1234567890123456789012345678901234567890,
    -50,
    "Agent repeatedly provided false information to clients"
);
```

#### **Creating Agent Status Proposals**
```solidity
// Propose to activate/deactivate an agent
function proposeAgentStatusChange(
    address agent,          // Agent's address
    bool newStatus,         // true = active, false = inactive
    string memory reason    // Reason for change
) external returns (uint256 proposalId)

// Example usage:
dao.proposeAgentStatusChange(
    0x1234567890123456789012345678901234567890,
    false,
    "Suspend agent pending investigation"
);
```

#### **Voting on Proposals**
```solidity
// Vote on any proposal (standard Governor functionality)
dao.castVote(proposalId, support); // 0=Against, 1=For, 2=Abstain
```

### **2. SepoliaStateMirror.sol - State Mirroring**

This contract **automatically receives** updates from Hedera. No manual calls needed.

#### **Querying Mirrored Data**
```solidity
// Get agent information
AgentInfo memory agent = stateMirror.getAgentInfo(agentAddress);

// Get reputation history
ReputationHistory[] memory history = stateMirror.getAgentReputationHistory(agentAddress);

// Get transaction records
TransactionRecord[] memory sales = stateMirror.getSellerTransactions(sellerAddress);
```

#### **Graph Indexing Events**
The contract emits these events for The Graph subgraph:
- `AgentRegisteredMirror` - When agents register on Hedera
- `ReputationUpdatedMirror` - When reputation changes
- `TransactionFinalizedMirror` - When transactions complete

### **3. HederaCCIPHandler.sol - DAO Decision Execution**

This contract **automatically receives** DAO decisions and executes them.

#### **Manual Execution (if needed)**
```solidity
// If auto-execution fails, manually execute a DAO decision
ccipHandler.executeReputationOverride(messageId);
```

#### **Notification Functions (for Agent contracts)**
```solidity
// Notify of new agent registration
ccipHandler.notifyAgentRegistration(agent, "code-reviewer", txHash);

// Notify of completed transaction
ccipHandler.notifyTransactionFinalized(
    buyer, seller, rating, "service", amount, txHash
);
```

### **4. AgentCCIPIntegrator.sol - Helper for Existing Contracts**

For existing agent contracts that need CCIP integration:

```solidity
// In your existing agent contract:
contract YourAgentContract {
    AgentCCIPIntegrator integrator;
    
    function registerAgent(address agent, string memory tag) external {
        // Your existing registration logic...
        
        // Notify CCIP system
        integrator.notifyAgentRegistration(agent, tag);
    }
    
    function finalizeTransaction(address buyer, address seller, int8 rating) external {
        // Your existing transaction logic...
        
        // Notify CCIP system  
        integrator.notifyTransactionFinalized(
            buyer, seller, rating, "service", msg.value
        );
    }
}
```

## 🔧 Configuration & Management

### **Updating CCIP Settings**

#### **On Sepolia DAO:**
```solidity
// Update CCIP configuration (requires governance proposal)
dao.updateCCIPConfiguration(
    newCCIPSender,
    newHederaChainSelector, 
    newHederaAgentManager
);
```

#### **On Hedera CCIP Handler:**
```solidity
// Update CCIP settings (owner only)
ccipHandler.updateCCIPConfig(
    sepoliaChainSelector,
    sepoliaStateMirrorAddress,
    ccipSenderAddress,
    true // enabled
);
```

### **Managing Allowlists**
```solidity
// Update which chains/senders are allowed
ccipHandler.updateAllowlists(
    [chainSelector1, chainSelector2],
    [sender1, sender2],
    [true, true] // statuses
);
```

### **Funding for CCIP Fees**

#### **Fund Sepolia CCIP Sender:**
```solidity
// Transfer LINK tokens to the CCIP sender for fees
linkToken.transfer(ccipSenderAddress, amount);
```

#### **Fund Hedera CCIP Sender:**
```solidity  
// Fund with native token or LINK (depending on configuration)
ccipSender.fundForFees{value: 1 ether}();
```

## 📊 Monitoring & Analytics

### **DAO Statistics**
```solidity
// Get DAO performance metrics
(uint256 totalProposals, 
 uint256 totalExecuted,
 uint256 totalRepOverrides,
 address ccipAddress,
 uint64 hederaChain) = dao.getDAOStatistics();
```

### **State Mirror Statistics**
```solidity
// Get system-wide statistics
(uint256 totalAgents,
 uint256 totalTransactions, 
 uint256 totalRepUpdates) = stateMirror.getSystemStats();
```

### **CCIP Handler Statistics**  
```solidity
// Get cross-chain execution statistics
(uint256 totalDecisions,
 uint256 totalOverrides,
 uint256 pendingDecisions) = ccipHandler.getStatistics();
```

## 🚨 Emergency Procedures

### **Pause CCIP Processing**
```solidity
// Emergency pause (owner only)
ccipHandler.emergencyPause(true); // pause
ccipHandler.emergencyPause(false); // unpause
```

### **Emergency Agent Status Override**
```solidity
// Emergency agent deactivation (StateMirror owner only)
stateMirror.emergencySetAgentStatus(
    agentAddress, 
    false,  // deactivate
    "Emergency security response"
);
```

### **Withdraw Stuck CCIP Fees**
```solidity
// Withdraw unused LINK tokens (owner only)
ccipSender.withdrawTokens(linkTokenAddress, amount);
```

## 🔍 The Graph Integration

### **Key Events to Index:**

#### **From SepoliaDAO:**
- `ReputationOverrideProposed`
- `ProposalExecutedCrossChain`
- `AgentStatusChangeProposed`

#### **From SepoliaStateMirror:**
- `AgentRegisteredMirror`
- `ReputationUpdatedMirror`  
- `TransactionFinalizedMirror`

#### **Sample Subgraph Query:**
```graphql
{
  agentRegistrations(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    hederaWalletId
    tag
    timestamp
    sourceChain
  }
  
  reputationUpdates(where: {updateType: "dao_override"}) {
    agentWalletId
    oldReputation
    newReputation
    timestamp
  }
  
  transactionRecords(first: 100) {
    buyer
    seller  
    rating
    transactionType
    timestamp
  }
}
```

## ⚡ Testing the System

### **End-to-End Test Flow:**

1. **Create DAO Proposal:**
   ```bash
   # Submit reputation override proposal
   npx hardhat run scripts/test-dao-proposal.js --network sepolia
   ```

2. **Vote on Proposal:**
   ```bash
   # Vote and wait for execution
   npx hardhat run scripts/vote-on-proposal.js --network sepolia
   ```

3. **Verify Hedera Execution:**
   ```bash
   # Check that reputation was updated on Hedera
   npx hardhat run scripts/verify-hedera-update.js --network hederaTestnet
   ```

4. **Check State Mirror:**
   ```bash  
   # Verify state was mirrored back to Sepolia
   npx hardhat run scripts/check-state-mirror.js --network sepolia
   ```

## 🔗 Contract Addresses

After deployment, your addresses will be saved in:
- `sepolia-deployment.json` - Sepolia contract addresses
- `hedera-ccip-deployment.json` - Hedera contract addresses

## 🎯 Next Steps

1. **Deploy to Testnets** - Use the deployment scripts
2. **Configure CCIP** - Update chain selectors and addresses
3. **Fund Contracts** - Add LINK tokens for CCIP fees  
4. **Test Proposals** - Create and execute test DAO proposals
5. **Setup Subgraph** - Index events for frontend queries
6. **Production Deployment** - Deploy to mainnets with proper security review

## 🆘 Troubleshooting

### **Common Issues:**

#### **CCIP Messages Failing:**
- Check LINK token balances
- Verify chain selectors are correct
- Ensure allowlists include correct addresses

#### **DAO Proposals Not Executing:**
- Check timelock delays have passed
- Verify proposal reached quorum
- Ensure CCIP sender is authorized

#### **State Mirror Not Updating:**
- Check Hedera contracts are calling notify functions
- Verify CCIP sender allowlist includes Hedera contracts
- Check CCIP router configurations

For more help, check the deployment logs and contract events!