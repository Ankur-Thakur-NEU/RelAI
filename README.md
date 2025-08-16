# Ì¥ñ RelAI: Decentralized Cross-Chain Reputation Registry for AI Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built for EthGlobal](https://img.shields.io/badge/Built%20for-EthGlobal%20NYC-blue.svg)](https://ethglobal.com/)
[![Hedera](https://img.shields.io/badge/Blockchain-Hedera-purple.svg)](https://hedera.com/)
[![Chainlink](https://img.shields.io/badge/Oracle-Chainlink-blue.svg)](https://chain.link/)

> **ÌøÜ EthGlobal NYC Hackathon Project** - A next-generation trust layer for AI agents in the decentralized economy

## Ì≥ã Table of Contents

- [ÌæØ Project Summary](#-project-summary)
- [‚ú® Key Features](#-key-features)
- [Ìª†Ô∏è Tech Stack](#Ô∏è-tech-stack)
- [Ì≤° Motivation](#-motivation)
- [Ì≥ñ Demo Story](#-demo-story)
- [Ì∫Ä Setup Instructions](#-setup-instructions)
- [Ì±• Team](#-team)
- [Ì¥ù Contributing](#-contributing)
- [Ì≥Ñ License](#-license)

## ÌæØ Project Summary

**RelAI** is a **Minimum Viable Product (MVP)** for a decentralized, cross-chain reputation registry for AI agents, built for the EthGlobal NYC hackathon. 

### The Problem Ì¥ç
In agent-driven markets, **trust is critical** but difficult to establish. Malicious actors can:
- Ì∫´ Lie about task outcomes
- Ì∑ëÔ∏è Delete test cases to hide failures  
- ÌøÉ‚Äç‚ôÇÔ∏è Chain-hop to evade accountability
- Ìæ≠ Exploit information silos

### Our Solution Ì≤°
RelAI creates a **transparent, tamper-proof system** to track AI agent reputations across blockchains, preventing malicious actors from exploiting vulnerabilities and ensuring accountability throughout the decentralized ecosystem.

## ‚ú® Key Features

### Ì¥ê **Agent Onboarding & Scoring**
- Smart contracts on **Hedera** store agent metadata (name, capabilities, reputation)
- Core functions: `registerAgent()`, `hireAndExecute()`, `updateReputation()`

### Ìºê **Third-Party Reputation Integration**
- **Chainlink Functions** fetches off-chain scores (GitHub stars, AI marketplace ratings)
- Verifies trustworthiness and detects lies (e.g., deleted test cases)

### ÌøõÔ∏è **DAO Governance**
- **OpenZeppelin Governor** enables community-driven proposals
- Voting system to approve or slash reputations fairly

### Ìºâ **Cross-Chain Syncing**
- **Chainlink CCIP** syncs reputations across chains (Hedera ‚Üî Ethereum)
- Prevents chain-hopping by bad actors

### Ì≥ä **Advanced Data Indexing**
- **The Graph** (subgraph) + **Hypergraph** for fast queries
- AI-accessible data with privacy features (MCP-like)

### Ìæ® **Interactive Frontend Dashboard**
- **React UI** with intuitive controls:
  - Ì¥ù Hire agents
  - Ì∫® Report malicious behavior  
  - Ì≥à Fetch third-party reputation data
  - Ì≥ö Story mode (honest vs. malicious scenarios)

### ÌæØ **Stretch Goal**
- **Stake-backed reputation** with token slashing for poor performance

## Ìª†Ô∏è Tech Stack

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

## Ì≤° Motivation

In an **automated, agent-driven economy**, blind trust creates serious risks:

- Ì≤∏ **Financial scams** and fraud
- Ì¥ß **Sabotage** of critical systems  
- Ì≥ä **Biased** centralized reputation systems
- ÌøõÔ∏è **Censorship** and manipulation

### RelAI's Vision Ìºü
Our registry provides a **unified, immutable trust layer** that ensures AI agents are:
- ‚úÖ **Verifiable** - Transparent reputation history
- Ì≥ù **Accountable** - Cross-chain tracking prevents escape  
- Ì¥ó **Interoperable** - Works across multiple blockchains
- Ì¥ù **Collaborative** - Enables secure economic interactions

## Ì≥ñ Demo Story

Our interactive dashboard tells a compelling narrative through **two parallel paths**:

### Ì∏á **Honest Agent Journey**
1. ÌæØ **Successful hires** ‚Üí Reputation increases
2. Ì≥à **Third-party validation** (via Chainlink Functions) ‚Üí Credibility boost
3. Ìºâ **Cross-chain sync** (via CCIP) ‚Üí Universal recognition
4. ÌøÜ **Result**: Higher demand and premium rates

### Ì±π **Malicious Agent Journey** 
1. Ì∫´ **Lies about outcomes** or deletes test evidence
2. Ì¥ç **Detection** via API checks and community reports
3. ‚öñÔ∏è **DAO dispute resolution** ‚Üí Community voting
4. Ì≤• **Result**: Reputation slashing and cross-chain flagging
5. Ì∫´ **Outcome**: Blacklisted across all supported chains

## Ì∫Ä Setup Instructions

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

## Ì±• Team

**Built by a 5-member team** for **EthGlobal NYC** Ì∑Ω

### Roles & Contributions:
- ÌøóÔ∏è **Smart Contract Development** - Core reputation logic
- Ì¥ó **Blockchain Integrations** - Chainlink CCIP & Functions
- Ì≥ä **Data Indexing** - The Graph & Hypergraph implementation  
- Ìæ® **UI/UX Design** - React dashboard and user experience
- Ì¥ß **DevOps & Deployment** - Infrastructure and hosting

### Targeting Sponsor Prizes ÌøÜ
- Ì¥ó **Chainlink** - CCIP & Functions integration
- Ì≥ä **The Graph** - Subgraph & Hypergraph utilization
- Ì≤ú **Hedera** - EVM-compatible smart contracts
- Ìª°Ô∏è **OpenZeppelin** - DAO governance implementation

## Ì¥ù Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow:
1. ÌΩ¥ Fork the repository
2. Ìºø Create a feature branch (`git checkout -b feature/amazing-feature`)
3. ‚úÖ Commit your changes (`git commit -m 'Add amazing feature'`)
4. Ì≥§ Push to the branch (`git push origin feature/amazing-feature`)
5. Ì¥Ñ Open a Pull Request

## Ì≥Ñ License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**‚≠ê Star this repo if you find RelAI interesting!**

![Built with ‚ù§Ô∏è](https://img.shields.io/badge/Built%20with-‚ù§Ô∏è-red.svg)
![EthGlobal NYC](https://img.shields.io/badge/EthGlobal-NYC%202024-blue.svg)

</div>
