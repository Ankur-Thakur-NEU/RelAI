import {
  AgentRegistered,
  TransactionFinalized,
  ReputationUpdated,
  MessageReceived
} from "../generated/ReputationMirrorSepolia/ReputationMirror";

import {
  Agent,
  Transaction,
  ReputationUpdate,
  CrossChainMessage,
  DailyStats
} from "../generated/schema";

import { BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";

// Constants
const ZERO_BI = BigInt.fromI32(0);
const ONE_BI = BigInt.fromI32(1);

export function handleAgentRegistered(event: AgentRegistered): void {
  log.info("í¾¯ Processing AgentRegistered for: {}", [event.params.agent.toHexString()]);
  
  let agent = Agent.load(event.params.agent.toHexString());
  if (!agent) {
    agent = new Agent(event.params.agent.toHexString());
    agent.address = event.params.agent;
    agent.currentReputation = BigInt.fromI32(85); // Default reputation
    agent.registrationTimestamp = event.block.timestamp;
    agent.totalTransactions = ZERO_BI;
    agent.averageRating = BigDecimal.fromString("0");
  }
  
  agent.tag = event.params.tag;
  agent.save();
  
  // Update daily stats
  updateDailyStats(event.block.timestamp, "newAgent");
  
  log.info("âœ… Agent registered: {} with tag: {}", [
    event.params.agent.toHexString(),
    event.params.tag
  ]);
}

export function handleTransactionFinalized(event: TransactionFinalized): void {
  let transactionId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let transaction = new Transaction(transactionId);
  
  transaction.buyer = event.params.buyer;
  transaction.seller = event.params.seller.toHexString();
  transaction.x402Ref = event.params.x402Ref;
  transaction.rating = event.params.rating;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.oldReputation = ZERO_BI; // Will be updated by ReputationUpdated event
  transaction.newReputation = ZERO_BI;
  transaction.reputationChange = ZERO_BI;
  
  transaction.save();
  
  // Update agent transaction count
  let agent = Agent.load(event.params.seller.toHexString());
  if (agent) {
    agent.totalTransactions = agent.totalTransactions.plus(ONE_BI);
    
    // Calculate new average rating (simplified)
    if (agent.totalTransactions.gt(ZERO_BI)) {
      let totalRating = agent.averageRating.times(agent.totalTransactions.minus(ONE_BI).toBigDecimal());
      totalRating = totalRating.plus(BigDecimal.fromString(event.params.rating.toString()));
      agent.averageRating = totalRating.div(agent.totalTransactions.toBigDecimal());
    } else {
      agent.averageRating = BigDecimal.fromString(event.params.rating.toString());
    }
    
    agent.save();
  }
  
  // Update daily stats
  updateDailyStats(event.block.timestamp, "newTransaction");
  
  log.info("í²³ Transaction finalized: {} rating: {}", [
    event.params.x402Ref,
    BigInt.fromI32(event.params.rating).toString()
  ]);
}

export function handleReputationUpdated(event: ReputationUpdated): void {
  let updateId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let reputationUpdate = new ReputationUpdate(updateId);
  
  reputationUpdate.agent = event.params.seller.toHexString();
  reputationUpdate.x402Ref = event.params.x402Ref;
  reputationUpdate.oldReputation = BigInt.fromI32(event.params.oldRep);
  reputationUpdate.newReputation = BigInt.fromI32(event.params.newRep);
  reputationUpdate.change = BigInt.fromI32(event.params.newRep).minus(BigInt.fromI32(event.params.oldRep));
  reputationUpdate.timestamp = event.block.timestamp;
  reputationUpdate.transactionHash = event.transaction.hash;
  
  reputationUpdate.save();
  
  // Update agent's current reputation
  let agent = Agent.load(event.params.seller.toHexString());
  if (agent) {
    agent.currentReputation = BigInt.fromI32(event.params.newRep);
    agent.save();
  }
  
  // Update transaction with reputation changes
  let transactionId = event.transaction.hash.toHexString() + "-0"; // Assuming first log
  let transaction = Transaction.load(transactionId);
  if (transaction) {
    transaction.oldReputation = BigInt.fromI32(event.params.oldRep);
    transaction.newReputation = BigInt.fromI32(event.params.newRep);
    transaction.reputationChange = BigInt.fromI32(event.params.newRep).minus(BigInt.fromI32(event.params.oldRep));
    transaction.save();
  }
  
  log.info("í³Š Reputation updated: {} {} -> {}", [
    event.params.seller.toHexString(),
    BigInt.fromI32(event.params.oldRep).toString(),
    BigInt.fromI32(event.params.newRep).toString()
  ]);
}

export function handleMessageReceived(event: MessageReceived): void {
  let message = new CrossChainMessage(event.params.messageId.toHexString());
  
  message.messageId = event.params.messageId;
  message.sourceChain = event.params.sourceChainSelector;
  message.destinationChain = BigInt.fromI32(11155111); // Sepolia
  message.sender = event.params.sender;
  message.receiver = event.transaction.to!;
  message.timestamp = event.block.timestamp;
  message.transactionHash = event.transaction.hash;
  message.status = "RECEIVED";
  
  // Decode message type from data
  if (event.params.data.length > 0) {
    let command = event.params.data[0];
    if (command == 1) {
      message.messageType = "REGISTER_AGENT";
    } else if (command == 2) {
      message.messageType = "FINALIZE_TRANSACTION";
    } else {
      message.messageType = "UNKNOWN";
    }
  } else {
    message.messageType = "EMPTY";
  }
  
  message.save();
  
  // Update daily stats
  updateDailyStats(event.block.timestamp, "newMessage");
  
  log.info("í¼‰ Cross-chain message received: {} type: {}", [
    event.params.messageId.toHexString(),
    message.messageType ? message.messageType! : "unknown"
  ]);
}

// Helper function to update daily statistics
function updateDailyStats(timestamp: BigInt, eventType: string): void {
  // Get date string (YYYY-MM-DD)
  let dayTimestamp = timestamp.toI32() - (timestamp.toI32() % 86400);
  let dayString = new Date(dayTimestamp * 1000).toISOString().substr(0, 10);
  
  let dailyStats = DailyStats.load(dayString);
  if (!dailyStats) {
    dailyStats = new DailyStats(dayString);
    dailyStats.date = dayString;
    dailyStats.newAgents = ZERO_BI;
    dailyStats.newTransactions = ZERO_BI;
    dailyStats.totalMessages = ZERO_BI;
    dailyStats.averageRating = BigDecimal.fromString("0");
  }
  
  if (eventType == "newAgent") {
    dailyStats.newAgents = dailyStats.newAgents.plus(ONE_BI);
  } else if (eventType == "newTransaction") {
    dailyStats.newTransactions = dailyStats.newTransactions.plus(ONE_BI);
  } else if (eventType == "newMessage") {
    dailyStats.totalMessages = dailyStats.totalMessages.plus(ONE_BI);
  }
  
  dailyStats.save();
}
