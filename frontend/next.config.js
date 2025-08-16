/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure webpack to handle node modules properly for web3
  webpack: (config) => {
    // Handle node modules that need fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_LOCK_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_LOCK_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    NEXT_PUBLIC_NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME || 'localhost',
    NEXT_PUBLIC_NETWORK_RPC_URL: process.env.NEXT_PUBLIC_NETWORK_RPC_URL || 'http://127.0.0.1:8545',
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '31337',
  },
};

module.exports = nextConfig;