const hre = require("hardhat");

async function main() {
  console.log("� Test Event Trigger for Subgraph");
  console.log("==================================");
  
  // Note: Since we can't directly trigger events on the ReputationMirror
  // (events are emitted by internal CCIP functions), let's show how 
  // the subgraph would work with a simple contract interaction
  
  const SEPOLIA_MIRROR = "0x0F9C8dD513b8dBB12Db9cf0AC44e975ec0a241a7";
  const [signer] = await hre.ethers.getSigners();
  
  console.log("� Contract:", SEPOLIA_MIRROR);
  console.log("� Account:", signer.address);
  console.log("� Network:", hre.network.name);
  
  console.log("\n� Current Status Check:");
  const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
  const contract = ReputationMirror.attach(SEPOLIA_MIRROR);
  
  try {
    const reputation = await contract.reputation(signer.address);
    const [messageId, data] = await contract.getLastReceivedMessageDetails();
    
    console.log("Reputation:", reputation.toString());
    console.log("Last Message ID:", messageId);
    console.log("Last Data Length:", data.length);
    
    console.log("\n� For Hackathon Demo:");
    console.log("1. Visit: https://thegraph.com/studio/subgraph/rel-aidao/");
    console.log("2. Show the GraphQL playground");
    console.log("3. Run the example queries");
    console.log("4. Explain how events auto-populate the graph");
    console.log("5. Demonstrate cross-chain architecture");
    
    console.log("\n� Events will populate when CCIP messages arrive!");
    
  } catch (error) {
    console.log("Contract interaction check:", error.message);
  }
}

main().catch(console.error);
