// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // Compile contracts if needed
  await hre.run("compile");

  // Get the contract factory
  const ReputationManager = await hre.ethers.getContractFactory("ReputationManager");

  console.log("Deploying ReputationManager...");
  const reputationManager = await ReputationManager.deploy(); // deploy returns the instance directly

  // Wait for deployment transaction to be mined
  await reputationManager.waitForDeployment();

  console.log(`ReputationManager deployed to: ${reputationManager.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
