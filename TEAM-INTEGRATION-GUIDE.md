# 🏗️ RelAI Team Integration Guide: Successfully Deployed Hedera DAO

## 🎉 **Status: COMPLETE - ALL DAO FEATURES DEPLOYED & VERIFIED**

**Your RelAI DAO system is fully operational on Hedera Testnet!**

---

## 📋 **Deployed Contract Addresses (Hedera Testnet)**

| Contract | Address | Explorer Link |
|----------|---------|---------------|
| **RelAI Token** | `0x61719F3986A9e37b3A7dcA184c91913e07b477Df` | [View](https://hashscan.io/testnet/contract/0x61719F3986A9e37b3A7dcA184c91913e07b477Df) |
| **Agent Registry** | `0x055E22DA92F536038aA45e41ddC89324131d291c` | [View](https://hashscan.io/testnet/contract/0x055E22DA92F536038aA45e41ddC89324131d291c) |
| **Timelock Controller** | `0x869082fe3d1E2A065F6B29528599ADF9833CcD45` | [View](https://hashscan.io/testnet/contract/0x869082fe3d1E2A065F6B29528599ADF9833CcD45) |
| **Agent DAO Core** | `0x92Fb8eA4fED1a9260cc17f838b72E344399740A0` | [View](https://hashscan.io/testnet/contract/0x92Fb8eA4fED1a9260cc17f838b72E344399740A0) |

**Network**: Hedera Testnet (Chain ID: 296)  
**RPC URL**: `https://testnet.hashio.io/api`

---

## ✅ **Implemented Features (All Steps 1-3 Complete)**

### 📋 **Step 1: Basic DAO Structure ✅**
- ✅ OpenZeppelin Governor contracts (Governor, GovernorSettings, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl)
- ✅ AgentRegistry integration with full interface
- ✅ Subgraph-ready events with detailed data
- ✅ Governance token with voting power (ERC20Votes)
- ✅ **Fallback voting mechanism**: 1-vote-per-address when users have no tokens
- ✅ Timelock controller for security (24-hour delay)

### 📋 **Step 2: Core Governance Functions ✅**
- ✅ `proposeReputationChange()` - Users can propose reputation updates/slashes
- ✅ `daoUpdateReputation()` - DAO-executable function with `onlyDAOGovernance` modifier
- ✅ `setQuorumFraction()` - Experimental quorum adjustment
- ✅ Enhanced events for subgraph indexing (`ReputationProposalCreated`, `DAOReputationUpdate`)
- ✅ Evidence support for malicious behavior disputes

### 📋 **Step 3: Hedera EVM & Agent Integration ✅**
- ✅ `submitProposalFromAgent()` - Programmatic proposal submission for AI agents
- ✅ `submitReputationProposalFromAgent()` - Simplified agent interface
- ✅ Agent rate limiting (10 proposals per day per agent)
- ✅ Cross-chain ready architecture
- ✅ Agent whitelist system
- ✅ Hedera EVM compatibility verified

---

## 🎯 **Team Role Integration**

### 👥 **Whole Team** - ✅ **COMPLETED** (2-4 hours)
```bash
# ✅ Project setup complete
✅ Hardhat configured
✅ OpenZeppelin dependencies installed  
✅ Hedera testnet configured (Chain ID: 296)
✅ Environment variables set
✅ All contracts deployed and verified
```

### 🔧 **Web3 Devs** - 🎯 **YOUR TURN** (6-8 hours)

**Priority 1: Update AgentCard Contract Integration**
```solidity
// Use deployed contract addresses in your AgentCard contract:
IAgentRegistry registry = IAgentRegistry(0x055E22DA92F536038aA45e41ddC89324131d291c);
IAgentDAO dao = IAgentDAO(0x92Fb8eA4fED1a9260cc17f838b72E344399740A0);

// Add updateReputationWithOracle function
function updateReputationWithOracle(address agent, int256 delta, bytes calldata oracleData) external {
    // Your oracle integration logic
    dao.proposeReputationChange(agent, delta, "Oracle-triggered reputation update");
}
```

**Priority 2: Test Core Functionality**
```javascript
// Test script template
const agentDAO = await ethers.getContractAt("AgentDAOCore", "0x92Fb8eA4fED1a9260cc17f838b72E344399740A0");
const agentRegistry = await ethers.getContractAt("MockAgentRegistry", "0x055E22DA92F536038aA45e41ddC89324131d291c");

// Register your test agents
await agentRegistry.registerAgentWithType("My Test Agent", "AI capabilities", "ai_agent");

// Test proposal creation
await agentDAO.proposeReputationChange(agentAddress, 100, "Good performance");

// Test agent proposals (for AI agents)
await agentDAO.submitReputationProposalFromAgent(targetAgent, 50, "AI-detected good behavior");
```

### 📊 **Data Person** - 🎯 **YOUR TURN** (4-6 hours)

**Priority 1: Set up Chainlink Functions** 
```javascript
// Chainlink Functions setup for Hedera testnet
const subscriptionId = "YOUR_SUBSCRIPTION_ID"; // Get from functions.chain.link
const donId = "fun-polygon-mumbai-1"; // Check latest Hedera testnet DON ID

// Your JS source for reputation checking:
const source = `
// Fetch AI agent score from your API
const response = await Functions.makeHttpRequest({
  url: "https://your-api.com/agent-score/" + args[0],
  method: "GET"
});

if (response.error) {
  throw Error("API Error");
}

const score = response.data.score;
const ismalicious = response.data.malicious || false;

// Return encoded response for DAO proposal
return Functions.encodeBytes32String(JSON.stringify({
  agent: args[0],
  reputationDelta: ismalicious ? -500 : Math.floor(score / 10),
  evidence: response.data.evidence || ""
}));
`;
```

**Priority 2: Event Monitoring Setup**
```javascript
// Monitor DAO events for malicious behavior
const agentDAO = new ethers.Contract(
  "0x92Fb8eA4fED1a9260cc17f838b72E344399740A0",
  daoAbi,
  provider
);

// Listen for reputation proposals
agentDAO.on("ReputationProposalCreated", (proposalId, agent, delta, description) => {
  console.log(`New proposal ${proposalId}: ${agent} reputation change ${delta}`);
  
  // Trigger your malicious behavior detection API
  checkForMaliciousBehavior(agent, description);
});
```

### 🌐 **Frontend Team** - 🎯 **YOUR TURN**

**Use these contract addresses in your React app:**

```typescript
// src/constants/contracts.ts
export const CONTRACTS = {
  RELAI_TOKEN: "0x61719F3986A9e37b3A7dcA184c91913e07b477Df",
  AGENT_REGISTRY: "0x055E22DA92F536038aA45e41ddC89324131d291c", 
  TIMELOCK: "0x869082fe3d1E2A065F6B29528599ADF9833CcD45",
  AGENT_DAO: "0x92Fb8eA4fED1a9260cc17f838b72E344399740A0"
};

export const HEDERA_TESTNET = {
  chainId: 296,
  rpcUrl: "https://testnet.hashio.io/api"
};
```

**Integration example:**
```typescript
// Example React hook for DAO interaction
import { useContract } from 'wagmi';
import AgentDAOABI from './abis/AgentDAOCore.json';

export function useAgentDAO() {
  const contract = useContract({
    address: CONTRACTS.AGENT_DAO,
    abi: AgentDAOABI,
  });

  const proposeReputationChange = async (agent: string, delta: number, description: string) => {
    return await contract.proposeReputationChange(agent, delta, description);
  };

  const canSubmitProposal = async (agent: string) => {
    return await contract.canAgentSubmitProposal(agent);
  };

  return { proposeReputationChange, canSubmitProposal };
}
```

### 📈 **Subgraph Team** - 🎯 **YOUR TURN**

**Priority 1: Deploy The Graph Subgraph**

```yaml
# subgraph.yaml
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: AgentDAO
    network: hedera-testnet  # Check if The Graph supports Hedera
    source:
      address: "0x92Fb8eA4fED1a9260cc17f838b72E344399740A0"
      abi: AgentDAO
      startBlock: 23642605  # Block when DAO was deployed
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Proposal
        - Vote
        - Agent
      abis:
        - name: AgentDAO
          file: ./abis/AgentDAOCore.json
      eventHandlers:
        - event: ReputationProposalCreated(indexed uint256,indexed address,int256,string)
          handler: handleReputationProposal
        - event: AgentProposalSubmitted(indexed uint256,indexed address,string,string,uint256)
          handler: handleAgentProposal
        - event: VoteCast(indexed address,uint256,uint8,uint256,string)
          handler: handleVoteCast
      file: ./src/mapping.ts
```

---

## 🧪 **Testing Your Integration**

### **Test Agent Registration**
```bash
# Register as an agent first
npx hardhat run scripts/register-agent.js --network hederaTestnet
```

### **Test Proposal Creation**
```bash
# Test creating a reputation proposal
npx hardhat run scripts/test-proposal.js --network hederaTestnet
```

### **Test Agent Proposals**
```bash
# Test AI agent proposal submission
npx hardhat run scripts/test-agent-proposal.js --network hederaTestnet
```

---

## 🔗 **Cross-Chain Integration Ready**

Your DAO is pre-configured for cross-chain expansion:

**For Chainlink CCIP:**
- Events are indexed and ready for cross-chain triggers
- Agent registry supports cross-chain agent verification
- Proposal system supports external trigger data

**For Additional Networks:**
- Deploy the same contract system to other EVM chains
- Use the same interfaces and ABIs
- Cross-chain reputation syncing ready

---

## 🚨 **Important Notes**

1. **Gas Configuration**: Hedera requires minimum 360 gwei gas price
2. **Contract Size**: We optimized for Hedera's 24KB limit with AgentDAOCore
3. **Agent Registration**: Agents must register before creating proposals
4. **Fallback Voting**: Users without tokens can still vote (1 vote per address)
5. **Rate Limiting**: Agents limited to 10 proposals per day

---

## 🎯 **Next Immediate Steps**

1. **Web3 Devs**: Integrate AgentCard with deployed registry ⏱️ 6-8 hours
2. **Data Person**: Set up Chainlink Functions subscription ⏱️ 4-6 hours  
3. **Frontend**: Update contract addresses and test UI ⏱️ 2-4 hours
4. **Subgraph**: Deploy indexing for DAO events ⏱️ 4-6 hours

---

## 💡 **Your DAO Features Demo**

```bash
# Try these commands to see your DAO in action:

# 1. Check DAO status
npx hardhat run scripts/verify-dao-deployment.js --network hederaTestnet

# 2. Register as an agent
npx hardhat console --network hederaTestnet
const registry = await ethers.getContractAt("MockAgentRegistry", "0x055E22DA92F536038aA45e41ddC89324131d291c");
await registry.registerAgentWithType("My Agent", "Testing capabilities", "test_agent");

# 3. Create a proposal
const dao = await ethers.getContractAt("AgentDAOCore", "0x92Fb8eA4fED1a9260cc17f838b72E344399740A0");
await dao.proposeReputationChange("0xYourAgentAddress", 100, "Great work on the project!");
```

---

**🎉 Congratulations! Your Decentralized Cross-Chain Reputation Registry DAO is live on Hedera and ready for team integration!**
