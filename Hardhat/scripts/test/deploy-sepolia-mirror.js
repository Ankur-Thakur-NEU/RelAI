const hre = require("hardhat");

async function main() {
  console.log("� Deploying ReputationMirror on Sepolia");
  console.log("========================================");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("� Account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("� Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance.toString() === "0") {
    console.log("❌ Insufficient funds! Need Sepolia testnet ETH");
    console.log("� Faucets:");
    console.log("   • https://sepoliafaucet.com/");
    console.log("   • https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("   • https://sepolia-faucet.pk910.de/");
    console.log("\n� Your address:", deployer.address);
    return;
  }
  
  const ReputationMirror = await hre.ethers.getContractFactory("ReputationMirror");
  
  // Sepolia CCIP router and LINK token
  const sepoliaRouter = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
  const sepoliaLink = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  
  console.log("� Deploying ReputationMirror...");
  console.log("� Router:", sepoliaRouter);
  console.log("� LINK:", sepoliaLink);
  
  const mirror = await ReputationMirror.deploy(sepoliaRouter, sepoliaLink);
  await mirror.waitForDeployment();
  
  const address = await mirror.getAddress();
  console.log("✅ ReputationMirror deployed at:", address);
  console.log("� Explorer: https://sepolia.etherscan.io/address/" + address);
  
  console.log("\n� Next steps:");
  console.log("1. Update Hedera contract with this address:");
  console.log("   setDestinationReceiver('" + address + "')");
  console.log("2. Fund Hedera contract with LINK tokens");
  console.log("3. Test registerAgent from Hedera");
  
  console.log("\n� Copy this address for message checker:", address);
}

main().catch(console.error);
