const hre = require("hardhat");
require("dotenv").config({path: '.env.local'});

async function main() {
  const HelloHedera = await hre.ethers.getContractFactory("ReputationManager");
  console.log("Deploying ReputationManager...");

  const hello = await HelloHedera.deploy(process.env.HEDERA_CHAINLINK_ROUTER, process.env.HEDERA_CHAINLINK_LINK);

  await hello.deploymentTransaction().wait();

  console.log("HelloHedera deployed at:", hello.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
