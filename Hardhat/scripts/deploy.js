require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Load deployer wallet
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Hedera testnet CCIP router and LINK token addresses (replace with actual addresses)
  const CCIP_ROUTER_ADDRESS = "0x802C5F84eAD128Ff36fD6a3f8a418e339f467Ce4";
  const LINK_TOKEN_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

  // Compile and get contract factory
  const ReputationManager = await ethers.getContractFactory("ReputationManager");

  // Deploy contract with constructor parameters
  const reputationManager = await ReputationManager.deploy(CCIP_ROUTER_ADDRESS, LINK_TOKEN_ADDRESS);

  // Wait for the deployment transaction to be mined
  await reputationManager.waitForDeployment();

  console.log("ReputationManager deployed to:", reputationManager.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
