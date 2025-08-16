require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    // Hedera Networks
    ...(process.env.HEDERA_PRIVATE_KEY ? {
      hederaTestnet: {
        url: process.env.HEDERA_TESTNET_URL || "https://testnet.hashio.io/api",
        accounts: [process.env.HEDERA_PRIVATE_KEY],
        chainId: 296, // Hedera Testnet Chain ID
        gas: 800000,
        gasPrice: 360000000000, // 360 gwei (Hedera minimum)
      },
      hederaMainnet: {
        url: process.env.HEDERA_MAINNET_URL || "https://mainnet.hashio.io/api", 
        accounts: [process.env.HEDERA_PRIVATE_KEY],
        chainId: 295, // Hedera Mainnet Chain ID
        gas: 800000,
        gasPrice: 360000000000, // 360 gwei (Hedera minimum)
      },
    } : {}),
    
    // Other Networks (optional for cross-chain)
    ...(process.env.SEPOLIA_PRIVATE_KEY ? {
      sepolia: {
        url: process.env.SEPOLIA_URL || "https://rpc.sepolia.org",
        accounts: [process.env.SEPOLIA_PRIVATE_KEY],
        chainId: 11155111,
      },
    } : {}),
    
    ...(process.env.MAINNET_PRIVATE_KEY ? {
      mainnet: {
        url: process.env.MAINNET_URL || "https://ethereum.publicnode.com",
        accounts: [process.env.MAINNET_PRIVATE_KEY],
        chainId: 1,
      },
    } : {}),
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
    },
  },
};