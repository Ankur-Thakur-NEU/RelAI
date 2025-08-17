const hre = require("hardhat");

async function main() {
  console.log("Ìºê Deploying ReputationMirror on Sepolia");
  console.log("========================================");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Ì±§ Account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Ì≤∞ Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance.toString() === "0") {
    console.log("‚ùå Insufficient funds! Need Sepolia testnet ETH");
    console.log("Ì∫∞ Faucets:");
    console.log("   ‚Ä¢ https://sepoliafaucet.com/");
    console.log("   ‚Ä¢ https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("   ‚Ä¢ https://sepolia-faucet.pk910.de/");
    console.log("\nÌ±§ Your address:", deployer.address);
    return;
  }
  
  const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
  
  // Sepolia CCIP router and LINK token
  const sepoliaRouter = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
  const sepoliaLink = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  
  console.log("Ì≥Ñ Deploying ReputationMirror...");
  console.log("Ì¥ó Router:", sepoliaRouter);
  console.log("Ì¥ó LINK:", sepoliaLink);
  
  const mirror = await ReputationMirror.deploy(sepoliaRouter, sepoliaLink);
  await mirror.waitForDeployment();
  
  const address = await mirror.getAddress();
  console.log("‚úÖ ReputationMirror deployed at:", address);
  console.log("Ì¥ó Explorer: https://sepolia.etherscan.io/address/" + address);
  
  console.log("\nÌ¥ß Next steps:");
  console.log("1. Update Hedera contract with this address:");
  console.log("   setDestinationReceiver('" + address + "')");
  console.log("2. Fund Hedera contract with LINK tokens");
  console.log("3. Test registerAgent from Hedera");
  
  console.log("\nÌ≥ç Copy this address for message checker:", address);
}

main().catch(console.error);
