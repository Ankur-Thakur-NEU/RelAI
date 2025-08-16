Decentralized Cross-Chain Reputation Registry for AI Agents
Project Summary
This project is a Minimum Viable Product (MVP) for a decentralized, cross-chain reputation registry for AI agents, built for a hackathon. It addresses the challenge of trust in agent-driven markets by creating a transparent, tamper-proof system to track AI agent reputations across blockchains, preventing malicious actors from exploiting silos or evading accountability (e.g., lying about task outcomes or deleting test cases). Using Hedera as the primary chain, the registry leverages Chainlink CCIP for cross-chain syncing, Chainlink Functions for third-party reputation data (e.g., GitHub stars or AI marketplace scores), The Graph (with Hypergraph) for indexing and AI-friendly queries, and OpenZeppelin for DAO governance. A frontend dashboard enables users to register agents, simulate hires, report malice, and query reputations, showcasing a story where honest agents gain reputation while malicious ones are flagged and slashed across chains.
Key Features

Agent Onboarding & Scoring: Smart contracts on Hedera store agent metadata (name, capabilities, reputation) with functions like registerAgent(), hireAndExecute(), and updateReputation().
Third-Party Reputation: Chainlink Functions fetches off-chain scores (e.g., mock AI agent performance) to verify trustworthiness or detect lies (e.g., test deletions).
DAO Governance: OpenZeppelin Governor enables community-driven proposals and voting to approve or slash reputations, ensuring fairness.
Cross-Chain Syncing: Chainlink CCIP syncs reputations across chains (e.g., Hedera to Ethereum), preventing chain-hopping by bad actors.
Data Indexing: The Graph (subgraph) and Hypergraph index events for fast queries, with Hypergraph enabling private, AI-accessible data (MCP-like).
Frontend Dashboard: React UI with buttons for hiring, reporting malice, fetching third-party data, and a story mode demonstrating honest vs. malicious agent scenarios.
Stretch Goal: Stake-backed reputation with token slashing for poor performance.

Tech Stack

Blockchain: Hedera (EVM-compatible)
Cross-Chain: Chainlink CCIP
Off-Chain Data: Chainlink Functions
Indexing: The Graph (subgraph + Hypergraph)
Governance: OpenZeppelin
Frontend: React, ethers.js, Tailwind CSS
Tools: Hardhat, Hedera SDK, Vercel (hosting)

Motivation
In an automated, agent-driven economy, blind trust risks scams or sabotage. Centralized reputation systems create silos, bias, and censorship. Our registry offers a unified, immutable trust layer, ensuring AI agents are verifiable, accountable, and interoperable across chains, fostering secure collaboration and economic interactions.
Demo Story
The dashboard narrates a dual path:

Honest Agent: Hires succeed, third-party data (via Functions) boosts rep, synced via CCIP.
Malicious Agent: Lies or deletes tests, detected by API checks or DAO disputes, leading to reputation slashing and cross-chain flagging.

Setup Instructions

Clone repo: git clone <repo-url>
Install: npm install
Configure: Set HBAR_ACCOUNT_ID, PRIVATE_KEY, CHAINLINK_SUBSCRIPTION_ID in .env
Deploy contracts: npx hardhat deploy --network hederaTestnet
Deploy subgraph/Hypergraph: Use Graph Studio and Hypergraph SDK
Run frontend: cd frontend && npm start

Team
Built by a 5-member team for a EthGlobal NYC, targeting Chainlink, The Graph, and other sponsor prizes. Contributions include smart contracts, integrations, and UI/UX design.
