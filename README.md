# ��� RelAI: Decentralized Cross-Chain Reputation Registry for AI Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built for EthGlobal](https://img.shields.io/badge/Built%20for-EthGlobal%20NYC-blue.svg)](https://ethglobal.com/)
[![Hedera](https://img.shields.io/badge/Blockchain-Hedera-purple.svg)](https://hedera.com/)
[![Chainlink](https://img.shields.io/badge/Oracle-Chainlink-blue.svg)](https://chain.link/)

> **��� EthGlobal NYC Hackathon Project** - A next-generation trust layer for AI agents in the decentralized economy

## ��� Table of Contents

- [��� Project Summary](#-project-summary)
- [✨ Key Features](#-key-features)
- [���️ Tech Stack](#️-tech-stack)
- [��� Motivation](#-motivation)
- [��� Demo Story](#-demo-story)
- [��� Setup Instructions](#-setup-instructions)
- [��� Team](#-team)
- [��� Contributing](#-contributing)
- [��� License](#-license)

## ��� Project Summary

**RelAI** is a **Minimum Viable Product (MVP)** for a decentralized, cross-chain reputation registry for AI agents, built for the EthGlobal NYC hackathon. 

### The Problem ���
In agent-driven markets, **trust is critical** but difficult to establish. Malicious actors can:
- Lie about task outcomes
- Delete test cases to hide failures  
- Chain-hop to evade accountability
- Exploit information silos

### Our Solution
RelAI creates a **transparent, tamper-proof system** to track AI agent reputations across blockchains, preventing malicious actors from exploiting vulnerabilities and ensuring accountability throughout the decentralized ecosystem.

## ✨ Key Features

### **Agent Onboarding & Scoring**
- Smart contracts on **Hedera** store agent metadata (name, capabilities, reputation)
- Core functions: `registerAgent()`, `hireAndExecute()`, `updateReputation()`

### **Third-Party Reputation Integration**
- **Chainlink Functions** fetches off-chain scores (GitHub stars, AI marketplace ratings)
- Verifies trustworthiness and detects lies (e.g., deleted test cases)

### **DAO Governance**
- **OpenZeppelin Governor** enables community-driven proposals
- Voting system to approve or slash reputations fairly

### **Cross-Chain Syncing**
- **Chainlink CCIP** syncs reputations across chains (Hedera ↔ Ethereum)
- Prevents chain-hopping by bad actors

### **Advanced Data Indexing**
- **The Graph** (subgraph) + **Hypergraph** for fast queries
- AI-accessible data with privacy features (MCP-like)

###  **Interactive Frontend Dashboard**
- **React UI** with intuitive controls:
  - Hire agents
  - Report malicious behavior  
  - Fetch third-party reputation data
  - Story mode (honest vs. malicious scenarios)

### **Stretch Goal**
- **Stake-backed reputation** with token slashing for poor performance

## Tech Stack

### Blockchain & Smart Contracts
- ![Hedera](https://img.shields.io/badge/Hedera-EVM--compatible-purple) **Hedera** - Primary blockchain
- ![Chainlink](https://img.shields.io/badge/Chainlink-CCIP-blue) **Chainlink CCIP** - Cross-chain messaging
- ![Chainlink](https://img.shields.io/badge/Chainlink-Functions-blue) **Chainlink Functions** - Off-chain data integration
- ![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-Governor-orange) **OpenZeppelin** - DAO governance

### Indexing & Data
- ![The Graph](https://img.shields.io/badge/The%20Graph-Subgraph-pink) **The Graph** - Data indexing
- ![Hypergraph](https://img.shields.io/badge/Hypergraph-Private%20Data-green) **Hypergraph** - AI-accessible private data

### Frontend & Development
- ![React](https://img.shields.io/badge/React-18.x-blue) **React** - User interface
- ![ethers.js](https://img.shields.io/badge/ethers.js-6.x-purple) **ethers.js** - Blockchain interaction
- ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan) **Tailwind CSS** - Styling
- ![Hardhat](https://img.shields.io/badge/Hardhat-Development-yellow) **Hardhat** - Smart contract development
- ![Vercel](https://img.shields.io/badge/Vercel-Hosting-black) **Vercel** - Frontend hosting

## Motivation

In an **automated, agent-driven economy**, blind trust creates serious risks:

- **Financial scams** and fraud
- **Sabotage** of critical systems  
- **Biased** centralized reputation systems
- **Censorship** and manipulation

### RelAI's Vision
Our registry provides a **unified, immutable trust layer** that ensures AI agents are:
- ✅ **Verifiable** - Transparent reputation history
- **Accountable** - Cross-chain tracking prevents escape  
- **Interoperable** - Works across multiple blockchains
- **Collaborative** - Enables secure economic interactions

## Demo Story

Our interactive dashboard tells a compelling narrative through **two parallel paths**:

### **Honest Agent Journey**
1. **Successful hires** → Reputation increases
2. **Third-party validation** (via Chainlink Functions) → Credibility boost
3. **Cross-chain sync** (via CCIP) → Universal recognition
4. **Result**: Higher demand and premium rates

### **Malicious Agent Journey** 
1. **Lies about outcomes** or deletes test evidence
2. **Detection** via API checks and community reports
3. **DAO dispute resolution** → Community voting
4. **Result**: Reputation slashing and cross-chain flagging
5. **Outcome**: Blacklisted across all supported chains

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Ankur-Thakur-NEU/RelAI.git
cd RelAI

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Add your credentials:
# HBAR_ACCOUNT_ID=0.0.xxxxx
# PRIVATE_KEY=your_private_key_here
# CHAINLINK_SUBSCRIPTION_ID=your_subscription_id
```

### Deployment

```bash
# Deploy smart contracts to Hedera testnet
npx hardhat deploy --network hederaTestnet

# Deploy subgraph to The Graph
# Follow Graph Studio documentation
# Deploy Hypergraph using Hypergraph SDK
```

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Start development server
npm start

# Build for production
npm run build
```

## Team

**Built by a 5-member team** for **EthGlobal NYC** ���

### Roles & Contributions:
- **Smart Contract Development** - Core reputation logic
- **Blockchain Integrations** - Chainlink CCIP & Functions
- **Data Indexing** - The Graph & Hypergraph implementation  
- **UI/UX Design** - React dashboard and user experience
- **DevOps & Deployment** - Infrastructure and hosting

### Targeting Sponsor Prizes
- **Chainlink** - CCIP & Functions integration
- **The Graph** - Subgraph & Hypergraph utilization
- **Hedera** - EVM-compatible smart contracts
- **OpenZeppelin** - DAO governance implementation

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repo if you find RelAI interesting!**

![Built with ❤️](https://img.shields.io/badge/Built%20with-❤️-red.svg)
![EthGlobal NYC](https://img.shields.io/badge/EthGlobal-NYC%202024-blue.svg)

</div>
