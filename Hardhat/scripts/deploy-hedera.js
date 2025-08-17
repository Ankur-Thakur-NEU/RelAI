const hre = require("hardhat");

async function main() {
  const HelloHedera = await hre.ethers.getContractFactory("HelloHedera");
  console.log("Deploying HelloHedera...");

  const hello = await HelloHedera.deploy("Hello from Hedera!");

  await hello.deploymentTransaction().wait();

  console.log("HelloHedera deployed at:", hello.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
