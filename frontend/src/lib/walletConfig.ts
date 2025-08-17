import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

// Wallet Types
export type WalletType = 'metamask' | 'coinbase' | 'walletconnect' | 'abstract';

export interface WalletInfo {
  name: string;
  type: WalletType;
  icon: string;
  description: string;
  installUrl?: string;
}

export interface ExtendedWalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  walletType: WalletType | null;
  balance?: string;
}

// Wallet configurations
export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    name: 'MetaMask',
    type: 'metamask',
    icon: 'svg', // Will be handled by component
    description: 'Connect with MetaMask wallet',
    installUrl: 'https://metamask.io/download/',
  },
  {
    name: 'Coinbase Wallet',
    type: 'coinbase',
    icon: 'svg', // Will be handled by component
    description: 'Connect with Coinbase Wallet',
    installUrl: 'https://www.coinbase.com/wallet',
  },
  {
    name: 'WalletConnect',
    type: 'walletconnect',
    icon: 'svg', // Will be handled by component
    description: 'Connect with WalletConnect',
  },
  {
    name: 'Abstract',
    type: 'abstract',
    icon: 'svg', // Will be handled by component
    description: 'Connect with Abstract Wallet',
  },
];

// Chain configurations for your contracts
export const SUPPORTED_CHAINS = {
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Test Network',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.drpc.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  hedera: {
    chainId: '0x128', // 296 in hex (Hedera testnet)
    chainName: 'Hedera Testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  },
};

// Your contract addresses
export const CONTRACT_ADDRESSES = {
  sepolia: {
    reputationMirror: '0x0F9C8dD513b8dBB12Db9cf0AC44e975ec0a241a7',
    demoGenerator: '0x37A854dCf622988D5Abd5f4BfFa738eB0Fc65348',
  },
  hedera: {
    reputationManager: '0x2b62128E7ad12d9C437f89c1be66B00e9d000d94',
  },
};

// Initialize Coinbase Wallet
export const getCoinbaseWallet = () => {
  return new CoinbaseWalletSDK({
    appName: 'RelAI - Cross-Chain Reputation System',
    appLogoUrl: '/logo/abstract_wallet.svg',
  });
};

// Check if wallet is installed
export const isWalletInstalled = (walletType: WalletType): boolean => {
  if (typeof window === 'undefined') return false;

  switch (walletType) {
    case 'metamask':
      return Boolean(window.ethereum?.isMetaMask);
    case 'coinbase':
      return Boolean(window.ethereum?.isCoinbaseWallet) || Boolean(window.coinbaseWalletExtension);
    case 'walletconnect':
      return true; // WalletConnect doesn't require installation
    case 'abstract':
      return Boolean(window.ethereum?.isAbstract);
    default:
      return false;
  }
};

// Get wallet install URL
export const getInstallUrl = (walletType: WalletType): string => {
  const wallet = SUPPORTED_WALLETS.find(w => w.type === walletType);
  return wallet?.installUrl || '';
};
