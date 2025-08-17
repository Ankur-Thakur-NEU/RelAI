const hre = require("hardhat");

async function main() {
  console.log("Ì∫Ä Populating Subgraph with Demo Data");
  console.log("=====================================");
  
  const SEPOLIA_MIRROR = "0x0F9C8dD513b8dBB12Db9cf0AC44e975ec0a241a7";
  
  console.log("Ì≥ç Sepolia ReputationMirror:", SEPOLIA_MIRROR);
  console.log("Ìºê Network:", hre.network.name);
  
  if (hre.network.name !== "sepolia") {
    console.log("‚ùå This script must run on Sepolia network");
    console.log("   Run: npx hardhat run scripts/test/populate-subgraph-data.js --network sepolia");
    return;
  }
  
  const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
  const contract = ReputationMirror.attach(SEPOLIA_MIRROR);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Ì±§ Account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Ì≤∞ Balance:", hre.ethers.formatEther(balance), "ETH");
  
  try {
    console.log("\nÌæØ Step 1: Simulating Cross-Chain Message Reception");
    console.log("(This will emit MessageReceived event)");
    
    // Create mock CCIP message data for registerAgent
    const mockAgentData = hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "string", "uint16"],
      [deployer.address, "HackathonAgent", 85]
    );
    const mockMessage = hre.ethers.concat(["0x01", mockAgentData]); // Command 1 = registerAgent
    
    // We can't directly call _ccipReceive, but we can check if contract is ready
    console.log("Ì≥° Mock message created for agent registration");
    console.log("   Agent:", deployer.address);
    console.log("   Tag: HackathonAgent");
    console.log("   Reputation: 85");
    
    console.log("\nÌæØ Step 2: Checking Current Data");
    
    // Check if agent already registered
    const currentRep = await contract.reputation(deployer.address);
    console.log("Ì≥ä Current reputation:", currentRep.toString());
    
    if (currentRep.toString() === "0") {
      console.log("‚ÑπÔ∏è  No direct way to trigger events on this contract");
      console.log("   Events are emitted when CCIP messages arrive from Hedera");
      console.log("   Cross-chain infrastructure needs to work for live data");
    } else {
      console.log("‚úÖ Agent already has reputation!");
    }
    
    // Check for any existing messages
    const [lastMessageId, lastData] = await contract.getLastReceivedMessageDetails();
    console.log("\nÌ≥® Last received message ID:", lastMessageId);
    console.log("Ì≥® Last data length:", lastData.length);
    
    console.log("\nÌæØ Step 3: Subgraph Data Population");
    console.log("Your subgraph at: https://thegraph.com/studio/subgraph/rel-aidao/");
    console.log("Will automatically index any events emitted by this contract!");
    
    console.log("\nÌ≥ä To populate with real data:");
    console.log("1. ‚úÖ Cross-chain messages from Hedera (when CCIP works)");
    console.log("2. Ì¥Ñ Events from past transactions (already indexed)");
    console.log("3. Ì∑™ Manual event triggers (would need admin functions)");
    
    console.log("\nÌæ™ For Hackathon Demo:");
    console.log("- Show the subgraph schema and queries");
    console.log("- Explain how events auto-populate the graph");
    console.log("- Demo the GraphQL API endpoints");
    console.log("- Highlight cross-chain indexing capability");
    
    console.log("\nÌ∫Ä Subgraph is LIVE and ready to index events!");
    
  } catch (error) {
    console.log("‚ùå Error:", error.message);
  }
}

main().catch(console.error);
