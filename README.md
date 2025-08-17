# RelAI: Decentralized Cross-Chain Reputation Registry for AI Agents

# Decentralized AI Agent Reputation Registry  

**On-chain, cross-chain reputation for AI agents — DAO-governed, oracle-secured, slashing-ready.**  
Built for **ETHGlobal** by a team of 5.  

---

## Table of Contents
- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [Technical Architecture](#technical-architecture)
- [Current Implementation](#current-implementation)
- [Roadmap](#roadmap)
- [Why Hedera](#why-hedera)
- [Why Zircuit (Best-App-Idea)](#why-zircuit-best-app-idea)
- [Why Coinbase Wallet](#why-coinbase-wallet)
- [Team](#team)
- [License](#license)

---

## Overview  
AI agents are rapidly becoming autonomous actors in finance, commerce, and Web3 ecosystems.  
But trust is broken: reputation is fragmented, off-chain, and easily manipulated.  

We are building the **first decentralized reputation registry for AI agents**, bringing verified reputation data on-chain and syncing it across chains. Our system ensures that agent trust is:  
- **Oracle-secured** (via Chainlink Functions).  
- **DAO-governed** (onboarding, updates, slashing).  
- **Cross-chain consistent** (via Chainlink CCIP / LayerZero-style messaging).  
- **Tamper-proof and portable** across ecosystems.  
- **Directly usable by agents** for autonomous microtransactions.  

---

## Problem  
- Current AI reputation systems are siloed, closed, and spoofable.  
- Malicious agents can clone identities and inflate scores.  
- No portable, auditable trust layer exists across dApps, chains, or marketplaces.  

---

## Solution  
A **decentralized reputation registry** that:  
- Uses Chainlink Functions to fetch and extrapolate reputation signals from APIs like [artificialanalysis.ai](https://artificialanalysis.ai).  
- Anchors agent reputation data on-chain in the `ReputationManager.sol` contract.  
- Lets a DAO govern onboarding, updates, and slashing to ensure fairness and accountability.  
- Syncs state across chains to prevent malicious divergence or cloned reputations.  
- Powers **autonomous agent-to-agent payments** via **x402** and **Coinbase Wallet integration**, making trust and value exchange native to the AI economy.  

---

## Technical Architecture  

1. **Governance DAO (Sepolia)**  
   - Currently being built.  
   - Will allow stakers to propose/vote on agent onboarding, reputation updates, and slashing.  

2. **Off-chain Data (Chainlink Functions)**  
   - Queries *artificialanalysis.ai* for agent reputation scores.  
   - Returns cryptographically signed results.  

3. **On-chain Registry (Hedera)**  
   - `ReputationManager.sol` contract stores canonical reputation records.  
   - Provides query endpoints for dApps, wallets, and marketplaces.  

4. **Payments Layer (x402 + Coinbase Wallet)**  
   - Agents can autonomously settle microtransactions via **x402**.  
   - Integrated with **Coinbase Wallet** for secure custody, onboarding, and direct user-agent or agent-agent interactions.  
   - This creates a **plug-and-play payment rail** tied to Coinbase’s ecosystem.  

5. **Cross-chain Messaging (CCIP, future)**  
   - Keeps reputations synced across chains.  
   - Prevents spoofing or malicious propagation.  

---

## Current Implementation  
- ✅ `ReputationManager.sol` deployed on **Hedera**.  
- ✅ **x402 payments integrated** — agents can perform autonomous microtransactions.  
- ✅ **Coinbase Wallet integration live** — agents and users can interact via Coinbase Wallet directly.  
- ⚙️ DAO governance — **currently being built** on **Sepolia**.  
- ❌ Chainlink Functions integration — planned, not completed during hackathon.  
- ❌ Cross-chain sync (CCIP) — in roadmap.  
- ❌ The Graph subgraph — in roadmap for efficient indexing & queries.  

---

## Roadmap  
- **Phase 1 (Hackathon)**: On-chain registry contract live on Hedera + **x402 payments + Coinbase Wallet integrated**.  
- **Phase 2 (Short-term)**: Integrate Chainlink Functions for oracle-secured reputation updates.  
- **Phase 3 (Mid-term)**: Implement CCIP for cross-chain state sync + deploy DAO on Sepolia fully.  
- **Phase 4 (Future)**: Build subgraph for queries, dashboards, and third-party integrations.  
- **Phase 5 (Vision)**: Deploy on Zircuit and expand Coinbase Wallet agent integrations for AI-native economies.  

---

## Why Hedera  
- Sustainable, fast, EVM-compatible network.  
- Strong developer support + **Hedera Agent Kit SDK** enables agent-native integration.  
- Ideal for our **proof-of-concept deployment**.  

---

## Why Zircuit (Best-App-Idea)  
Our **killer app vision** thrives on Zircuit because:  
- **Sequencer-level security** guarantees reputation updates are censorship-resistant and correctly ordered, preventing manipulation at the infrastructure layer.  
- **Account Abstraction (AA)** enables gasless DAO voting, one-click agent onboarding, and frictionless participation for both humans and AI agents.  
- **High performance** supports real-time reputation queries across marketplaces and dApps.  

With Zircuit, our project evolves from a proof-of-concept into the **global trust layer for AI agents**, positioning Zircuit as the backbone of the AI-driven Web3 economy.  

---

## Why Coinbase Wallet  
- **AI agents need wallets.** By integrating with Coinbase Wallet, we make it the **default trust anchor** for both humans and autonomous agents.  
- **Payments rail.** With **x402 + Coinbase Wallet**, agents can transact safely with microtransactions, subscriptions, or pay-per-task services.  
- **Onboarding at scale.** Coinbase Wallet lowers the barrier for millions of users to interact with AI agents directly.  
- **Ecosystem synergy.** This aligns perfectly with Coinbase’s push for smart wallets, on-chain identity, and secure agent interactions.  

Our implementation proves Coinbase Wallet can be the **hub for the autonomous AI economy**, starting with reputation + payments.  

---

## Team  
We are a team of 5 with expertise across:  
- **Protocol & DAO Design** — governance and incentive mechanisms.  
- **Smart Contract Development** — Ethereum, Hedera, and cross-chain infra.  
- **AI Systems & Data Pipelines** — reputation scoring, off-chain → on-chain flows.  
- **dApp Integrations & UX** — SDKs, subgraphs, Coinbase Wallet, and dashboards.  

---

## License  
MIT License  
