const { ethers } = require('hardhat');
const hre = require('hardhat');

/**
 * Hedera-compatible LayerZero message sender
 * Handles Hedera's minimum value requirement (1 tinybar = 10,000,000,000 wei)
 * 
 * Usage:
 * DST_EID=40161 MESSAGE="Your message" npx hardhat run hedera-send.js --network hedera-testnet
 * 
 * Environment variables:
 * - DST_EID: Destination endpoint ID (default: 40161 for Sepolia)
 * - MESSAGE: Message to send (default: "Hello ethereum")
 * - OPTIONS: Execution options hex (default: 500k gas)
 */

async function hederaSend() {
    try {
        // Configuration
        const destEid = process.env.DST_EID ? parseInt(process.env.DST_EID) : 40161; // Sepolia
        const message = process.env.MESSAGE || "Hello ethereum";
        const options = process.env.OPTIONS || "0x0003010011010000000000000000000000000007a120"; // 500k gas
        
        console.log(`🚀 Hedera-compatible LayerZero Send`);
        console.log(`📡 Network: ${hre.network.name}`);
        console.log(`🎯 Destination EID: ${destEid} (${destEid === 40161 ? 'Sepolia' : destEid === 40285 ? 'Hedera' : 'Unknown'})`);
        console.log(`💬 Message: "${message}"`);
        console.log(`⚙️  Options: ${options}`);
        
        // Get contract
        const contractAddress = '0xD26e0bDBb6a7797C2aE7bafb324DC63e108A805F';
        const MyOApp = await ethers.getContractFactory('MyOApp');
        const contract = MyOApp.attach(contractAddress);
        
        // Get quote
        const quote = await contract.quoteSendString(destEid, message, options, false);
        console.log(`💰 Quote: ${ethers.utils.formatEther(quote.nativeFee)} HBAR`);
        
        // Handle Hedera minimum value requirement
        const minHederaValue = ethers.BigNumber.from("10000000000"); // 1 tinybar
        const valueToSend = quote.nativeFee.gt(minHederaValue) ? quote.nativeFee : minHederaValue;
        
        if (valueToSend.gt(quote.nativeFee)) {
            console.log(`⚠️  Adjusting value to Hedera minimum: ${ethers.utils.formatEther(valueToSend)} HBAR`);
        }
        
        // Send transaction
        console.log(`📤 Sending transaction...`);
        const tx = await contract.sendString(destEid, message, options, {
            value: valueToSend,
            gasLimit: 5000000 // 5M gas for cross-chain (increased to debug)
        });
        
        console.log(`✅ Transaction sent!`);
        console.log(`📋 Hash: ${tx.hash}`);
        
        // Use correct explorer based on network
        let explorerUrl;
        if (hre.network.name === 'hedera-testnet') {
            explorerUrl = `https://hashscan.io/testnet/transaction/${tx.hash}`;
        } else if (hre.network.name === 'sepolia-testnet') {
            explorerUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
        } else {
            explorerUrl = `Transaction hash: ${tx.hash}`;
        }
        
        console.log(`🔗 Explorer: ${explorerUrl}`);
        console.log(`⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log(`🎉 Transaction successful!`);
            console.log(`📦 Block: ${receipt.blockNumber}`);
            console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
            
            // The message will be processed by LayerZero infrastructure
            console.log(`\n🌉 Cross-chain message sent successfully!`);
            console.log(`💡 Your message "${message}" is being delivered to EID ${destEid}`);
            console.log(`📍 Check the destination chain for message receipt`);
        } else {
            console.log(`❌ Transaction failed with status: ${receipt.status}`);
            console.log(`📦 Block: ${receipt.blockNumber}`);
            console.log(`⛽ Gas used: ${receipt.gasUsed.toString()} / ${receipt.gasLimit ? receipt.gasLimit.toString() : 'unknown'}`);
            
            // Check if it's a gas issue
            if (receipt.gasUsed.eq(receipt.gasLimit || ethers.BigNumber.from("2500000"))) {
                console.log(`⚠️  Transaction used all available gas - likely ran out of gas`);
            }
            
            // Provide common failure reasons
            console.log(`\n🔍 Common failure reasons:`);
            console.log(`• LayerZero testnet infrastructure issues`);
            console.log(`• DVN (Data Verification Network) configuration`);
            console.log(`• Insufficient gas for cross-chain execution`);
            console.log(`• Network connectivity issues`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.reason) {
            console.error('Reason:', error.reason);
        }
    }
}

hederaSend();
