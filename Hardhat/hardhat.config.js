// require("@chainlink/hardhat-chainlink"); // Temporarily disabled due to bcrypto dependency issue
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24", // Keep 0.8.24 for DAO compatibility
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  // chainlink: {
  //   confirmations: 1
  // }, // Temporarily disabled
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    // Hedera Networks - Support both environment variable naming conventions
    ...(process.env.HEDERA_PRIVATE_KEY || process.env.TESTNET_OPERATOR_PRIVATE_KEY ? {
      hederaTestnet: {
        url: process.env.HEDERA_TESTNET_URL || process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api",
        accounts: [process.env.HEDERA_PRIVATE_KEY || process.env.TESTNET_OPERATOR_PRIVATE_KEY],
        chainId: 296, // Hedera Testnet Chain ID
        gas: 800000,
        gasPrice: 360000000000, // 360 gwei (Hedera minimum)
      },
      // Alias for compatibility
      testnet: {
        url: process.env.HEDERA_TESTNET_URL || process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api",
        accounts: [process.env.HEDERA_PRIVATE_KEY || process.env.TESTNET_OPERATOR_PRIVATE_KEY],
        chainId: 296,
        gas: 800000,
        gasPrice: 360000000000,
      },
    } : {}),
    
    ...(process.env.HEDERA_PRIVATE_KEY ? {
      hederaMainnet: {
        url: process.env.HEDERA_MAINNET_URL || "https://mainnet.hashio.io/api", 
        accounts: [process.env.HEDERA_PRIVATE_KEY],
        chainId: 295, // Hedera Mainnet Chain ID
        gas: 800000,
        gasPrice: 360000000000, // 360 gwei (Hedera minimum)
      },
    } : {})
    
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
