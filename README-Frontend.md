# Web3 DApp Frontend

This is a Next.js frontend application that connects to your Hardhat smart contracts.

## Features

- 🦊 MetaMask wallet connection
- 🔗 Smart contract interaction (Lock contract)
- 📱 Responsive design with Tailwind CSS
- ⚡ Real-time contract state updates
- 🔒 TypeScript for type safety

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

### 3. Deploy Your Contracts

First, make sure your Hardhat contracts are compiled and deployed:

```bash
cd ../Hardhat
npx hardhat compile
npx hardhat node # Start local blockchain
# In another terminal:
npx hardhat ignition deploy ./ignition/modules/Lock.js --network localhost
```

### 4. Update Contract Address

After deploying, copy the contract address and update your `.env.local`:

```
NEXT_PUBLIC_LOCK_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your DApp.

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app directory
│   │   └── page.tsx        # Main page
│   ├── components/         # React components
│   │   ├── WalletConnect.tsx
│   │   └── LockContractInterface.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useWallet.ts
│   │   └── useLockContract.ts
│   └── lib/                # Utility libraries
│       ├── web3.ts         # Web3 utilities
│       └── contracts.ts    # Contract interfaces
├── .env.local.example      # Environment variables template
└── next.config.js          # Next.js configuration
```

## Development Workflow

### 1. Start Local Blockchain

```bash
cd Hardhat
npx hardhat node
```

### 2. Deploy Contracts

```bash
npx hardhat ignition deploy ./ignition/modules/Lock.js --network localhost
```

### 3. Update Frontend Config

Update the contract address in `.env.local` or use the helper script:

```bash
cd ..
node scripts/deploy-and-update-frontend.js
```

### 4. Configure MetaMask

Add the local network to MetaMask:
- Network Name: Localhost 8545
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency Symbol: ETH

Import one of the test accounts from Hardhat node output.

## Contract Integration

The frontend is pre-configured to work with the Lock contract. To add new contracts:

1. Add the contract ABI to `src/lib/contracts.ts`
2. Add the contract address to environment variables
3. Create hooks for contract interaction in `src/hooks/`
4. Create UI components in `src/components/`

## Troubleshooting

### MetaMask Issues

- Make sure MetaMask is connected to the correct network (localhost:8545)
- Refresh MetaMask if transactions are stuck
- Reset account if nonce issues occur

### Contract Not Found

- Verify the contract is deployed and the address is correct
- Check that the ABI matches the deployed contract
- Ensure you're connected to the correct network

### Build Issues

If you encounter webpack issues:

```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

## Deployment

### Production Deployment

1. Deploy contracts to your target network (Sepolia, Mainnet, etc.)
2. Update environment variables for production
3. Deploy frontend to Vercel, Netlify, or your preferred platform

```bash
npm run build
npm run start
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ethers.js v6** - Ethereum library
- **React Hooks** - State management