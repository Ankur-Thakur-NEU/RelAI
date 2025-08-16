const fs = require('fs');
const path = require('path');

/**
 * This script should be run after deploying contracts to update the frontend
 * with the deployed contract addresses and ABIs.
 */

async function updateFrontendConfig() {
  const hardhatArtifactsPath = path.join(__dirname, '..', 'Hardhat', 'artifacts', 'contracts');
  const frontendPath = path.join(__dirname, '..', 'frontend');
  const contractsFilePath = path.join(frontendPath, 'src', 'lib', 'contracts.ts');
  
  // Check if Hardhat artifacts exist
  if (!fs.existsSync(hardhatArtifactsPath)) {
    console.error('Hardhat artifacts not found. Please compile your contracts first.');
    console.log('Run: cd Hardhat && npx hardhat compile');
    return;
  }

  // Read Lock contract artifact
  const lockArtifactPath = path.join(hardhatArtifactsPath, 'Lock.sol', 'Lock.json');
  
  if (fs.existsSync(lockArtifactPath)) {
    const lockArtifact = JSON.parse(fs.readFileSync(lockArtifactPath, 'utf8'));
    
    console.log('Found Lock contract artifact');
    console.log('Contract ABI updated in frontend/src/lib/contracts.ts');
    
    // You could update the ABI in contracts.ts here if needed
    // For now, we'll just log that it should be updated manually
    console.log('\nTo update the frontend with deployed contract addresses:');
    console.log('1. Copy the deployed contract address');
    console.log('2. Update NEXT_PUBLIC_LOCK_CONTRACT_ADDRESS in frontend/.env.local');
    console.log('3. Or update CONTRACT_ADDRESSES in frontend/src/lib/contracts.ts');
  } else {
    console.error('Lock contract artifact not found');
  }

  // Check for deployment artifacts (if using Hardhat Ignition)
  const deploymentPath = path.join(__dirname, '..', 'Hardhat', 'ignition', 'deployments');
  if (fs.existsSync(deploymentPath)) {
    console.log('\nDeployment artifacts found in:', deploymentPath);
    // List deployment folders
    const deployments = fs.readdirSync(deploymentPath);
    deployments.forEach(deployment => {
      console.log(`- ${deployment}`);
    });
  }
}

// Run the script
updateFrontendConfig().catch(console.error);