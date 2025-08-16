const hre = require("hardhat");

async function main() {
  const HelloSepolia = await hre.ethers.getContractFactory("HelloSepolia");
  console.log("Deploying HelloSepolia...");

  // Deploy contract with constructor parameter
  const hello = await HelloSepolia.deploy("Hello from Sepolia!");

  // Wait for deployment to finish
  await hello.deploymentTransaction().wait();

  console.log("HelloSepolia deployed at:", hello.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
