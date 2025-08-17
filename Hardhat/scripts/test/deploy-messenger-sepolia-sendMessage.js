const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting Sepolia Messenger Deployment and Message Sending...");
  console.log("Network:", hre.network.name);
  
  // Get the account that will deploy the contract
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Get the contract factory
  const HelloSepolia = await hre.ethers.getContractFactory("HelloSepolia");
  console.log("📄 Deploying HelloSepolia contract...");

  // Deploy contract with an initial message
  const initialMessage = "Hello from Sepolia! Cross-chain messaging test.";
  const messenger = await HelloSepolia.deploy(initialMessage);

  // Wait for deployment to be mined
  await messenger.waitForDeployment();
  
  const contractAddress = await messenger.getAddress();
  console.log("✅ HelloSepolia deployed at:", contractAddress);
  console.log("📨 Initial message:", await messenger.message());

  // Send a new message
  console.log("\n🔄 Sending a new message...");
  const newMessage = "Updated message from Sepolia - " + new Date().toISOString();
  
  const tx = await messenger.setMessage(newMessage);
  console.log("⏳ Transaction hash:", tx.hash);
  
  // Wait for transaction to be mined
  await tx.wait();
  console.log("✅ Message sent successfully!");
  
  // Verify the message was updated
  const updatedMessage = await messenger.message();
  console.log("📨 New message:", updatedMessage);

  // Summary
  console.log("\n📋 Deployment Summary:");
  console.log("🌐 Network:", hre.network.name);
  console.log("📍 Contract Address:", contractAddress);
  console.log("💬 Current Message:", updatedMessage);
  console.log("🔗 Etherscan URL:", `https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error occurred:");
    console.error(error);
    process.exit(1);
  });
