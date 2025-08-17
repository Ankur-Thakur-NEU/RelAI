# í¼‰ Cross-Chain Reputation System Subgraph

A **hackathon-ready subgraph** that indexes reputation data from your cross-chain reputation system built with Chainlink CCIP.

## í¾¯ What it Indexes

âœ… **Agent Registrations** - Track when agents register across chains  
âœ… **Transaction Ratings** - Monitor feedback and ratings  
âœ… **Reputation Updates** - Real-time reputation changes  
âœ… **Cross-Chain Messages** - CCIP message activity  
âœ… **Daily Statistics** - Aggregated metrics for analytics

## íº€ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Code
```bash
npm run codegen
```

### 3. Build Subgraph
```bash
npm run build
```

### 4. Deploy to The Graph Studio
```bash
# Get your deploy key from https://thegraph.market/dashboard
npx graph auth --studio <YOUR_DEPLOY_KEY>
npx graph deploy --studio cross-chain-reputation
```

## í³Š Example Queries

### Get All Agents with Reputation
```graphql
{
  agents {
    id
    address
    tag
    currentReputation
    totalTransactions
    averageRating
    registrationTimestamp
  }
}
```

### Get Recent Transactions
```graphql
{
  transactions(orderBy: timestamp, orderDirection: desc, first: 10) {
    id
    buyer
    seller {
      tag
      currentReputation
    }
    rating
    x402Ref
    timestamp
    reputationChange
  }
}
```

### Get Cross-Chain Messages
```graphql
{
  crossChainMessages {
    id
    messageId
    sourceChain
    destinationChain
    messageType
    status
    timestamp
  }
}
```

### Get Daily Statistics
```graphql
{
  dailyStats(orderBy: date, orderDirection: desc) {
    date
    newAgents
    newTransactions
    totalMessages
    averageRating
  }
}
```

## í¿—ï¸ Architecture

- **Network**: Sepolia Testnet
- **Contract**: `0x0F9C8dD513b8dBB12Db9cf0AC44e975ec0a241a7`
- **Events Indexed**:
  - `AgentRegistered(address indexed agent, string tag)`
  - `TransactionFinalized(address indexed buyer, address indexed seller, string x402Ref, int8 rating)`
  - `ReputationUpdated(address indexed seller, string x402Ref, uint16 oldRep, uint16 newRep)`
  - `MessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender, bytes data)`

## í¾ª Hackathon Demo

Perfect for demonstrating:
- **Real-time reputation tracking** í³Š
- **Cross-chain data indexing** í¼‰  
- **GraphQL API for frontend** í´—
- **Analytics and insights** í³ˆ

## í³ Notes

- Currently indexes Sepolia only (Hedera support pending Graph Protocol integration)
- Optimized for hackathon demos with clean, simple queries
- Includes daily aggregations for time-series analytics
- Ready for production scaling with more detailed mappings

---

**Built for EthGlobal Hackathon 2024** í¿†
