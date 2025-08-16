/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable webpack 5
  webpack5: true,
  
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
    NEXT_PUBLIC_LOCK_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_LOCK_CONTRACT_ADDRESS,
    NEXT_PUBLIC_NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME,
    NEXT_PUBLIC_NETWORK_RPC_URL: process.env.NEXT_PUBLIC_NETWORK_RPC_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  },
};

module.exports = nextConfig;