// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // Get contract factory
  const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");

  // Deploy contract
  const registry = await ReputationManager.deploy();
  await registry.waitForDeployment();

  console.log("✅ ReputationManager deployed at:", await registry.getAddress());
}

// Run deployment
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
