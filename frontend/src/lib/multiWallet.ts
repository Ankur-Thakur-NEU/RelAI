import { ethers } from 'ethers';
import { WalletType, ExtendedWalletState, getCoinbaseWallet, isWalletInstalled, SUPPORTED_CHAINS } from './walletConfig';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isAbstract?: boolean;
    };
    coinbaseWalletExtension?: unknown;
  }
}

// Enhanced wallet connection class
export class MultiWalletConnector {
  private static instance: MultiWalletConnector;
  private currentWalletType: WalletType | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private coinbaseWallet: unknown = null;

  private constructor() {}

  static getInstance(): MultiWalletConnector {
    if (!MultiWalletConnector.instance) {
      MultiWalletConnector.instance = new MultiWalletConnector();
    }
    return MultiWalletConnector.instance;
  }

  // Connect to a specific wallet
  async connectWallet(walletType: WalletType): Promise<ExtendedWalletState> {
    console.log(`[CONNECTING] Connecting to ${walletType} wallet...`);

    try {
      switch (walletType) {
        case 'metamask':
          return await this.connectMetaMask();
        case 'coinbase':
          return await this.connectCoinbase();
        case 'walletconnect':
          return await this.connectWalletConnect();
        case 'abstract':
          return await this.connectAbstract();
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to connect ${walletType}:`, error);
      throw error;
    }
  }

  // MetaMask connection
  private async connectMetaMask(): Promise<ExtendedWalletState> {
    if (!window.ethereum?.isMetaMask) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.currentWalletType = 'metamask';

      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(address);

      console.log('[SUCCESS] MetaMask connected successfully');

      return {
        address,
        isConnected: true,
        chainId: Number(network.chainId),
        walletType: 'metamask',
        balance: ethers.formatEther(balance),
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: number }).code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw new Error(`MetaMask connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Coinbase Wallet connection
  private async connectCoinbase(): Promise<ExtendedWalletState> {
    try {
      // Try Coinbase Wallet Extension first
      if (window.ethereum?.isCoinbaseWallet) {
        await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.currentWalletType = 'coinbase';

        const signer = await this.provider.getSigner();
        const address = await signer.getAddress();
        const network = await this.provider.getNetwork();
        const balance = await this.provider.getBalance(address);

        console.log('[SUCCESS] Coinbase Extension connected successfully');

        return {
          address,
          isConnected: true,
          chainId: Number(network.chainId),
          walletType: 'coinbase',
          balance: ethers.formatEther(balance),
        };
      }

      // Fallback to Coinbase Wallet SDK
      this.coinbaseWallet = getCoinbaseWallet();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coinbaseProvider = (this.coinbaseWallet as any).makeWeb3Provider();
      
      await coinbaseProvider.request({
        method: 'eth_requestAccounts'
      });

      this.provider = new ethers.BrowserProvider(coinbaseProvider);
      this.currentWalletType = 'coinbase';

      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(address);

      console.log('[SUCCESS] Coinbase SDK connected successfully');

      return {
        address,
        isConnected: true,
        chainId: Number(network.chainId),
        walletType: 'coinbase',
        balance: ethers.formatEther(balance),
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: number }).code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw new Error(`Coinbase Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // WalletConnect connection (simplified for now)
  private async connectWalletConnect(): Promise<ExtendedWalletState> {
    // For now, fall back to any available web3 provider
    if (window.ethereum) {
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.currentWalletType = 'walletconnect';

      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(address);

      console.log('[SUCCESS] WalletConnect connected successfully');

      return {
        address,
        isConnected: true,
        chainId: Number(network.chainId),
        walletType: 'walletconnect',
        balance: ethers.formatEther(balance),
      };
    }

    throw new Error('No wallet found for WalletConnect');
  }

  // Abstract Wallet connection
  private async connectAbstract(): Promise<ExtendedWalletState> {
    if (!window.ethereum?.isAbstract) {
      throw new Error('Abstract Wallet is not installed. Please install Abstract Wallet to continue.');
    }

    try {
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.currentWalletType = 'abstract';

      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(address);

      console.log('[SUCCESS] Abstract Wallet connected successfully');

      return {
        address,
        isConnected: true,
        chainId: Number(network.chainId),
        walletType: 'abstract',
        balance: ethers.formatEther(balance),
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: number }).code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw new Error(`Abstract Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Switch network
  async switchNetwork(chainKey: 'sepolia' | 'hedera'): Promise<boolean> {
    if (!this.provider || !window.ethereum) {
      throw new Error('No wallet connected');
    }

    const chainConfig = SUPPORTED_CHAINS[chainKey];

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }],
      });

      console.log(`[SUCCESS] Switched to ${chainKey} network`);
      return true;
    } catch (error: unknown) {
      // Chain not added, try to add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });

          console.log(`[SUCCESS] Added and switched to ${chainKey} network`);
          return true;
        } catch (addError) {
          console.error(`[ERROR] Failed to add ${chainKey} network:`, addError);
          throw new Error(`Failed to add ${chainKey} network`);
        }
      }

      console.error(`[ERROR] Failed to switch to ${chainKey} network:`, error);
      throw new Error(`Failed to switch to ${chainKey} network`);
    }
  }

  // Get current wallet state
  async getCurrentState(): Promise<ExtendedWalletState> {
    if (!this.provider) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        walletType: null,
      };
    }

    try {
      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(address);

      return {
        address,
        isConnected: true,
        chainId: Number(network.chainId),
        walletType: this.currentWalletType,
        balance: ethers.formatEther(balance),
      };
    } catch (error) {
      console.error('Error getting current wallet state:', error);
      return {
        address: null,
        isConnected: false,
        chainId: null,
        walletType: null,
      };
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    if (this.coinbaseWallet) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.coinbaseWallet as any).disconnect();
    }

    this.provider = null;
    this.currentWalletType = null;
    this.coinbaseWallet = null;

    console.log('[DISCONNECT] Wallet disconnected');
  }

  // Get provider for contract interactions
  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  // Get signer for transactions
  async getSigner(): Promise<ethers.JsonRpcSigner | null> {
    if (!this.provider) return null;
    return await this.provider.getSigner();
  }
}

// Singleton instance
export const walletConnector = MultiWalletConnector.getInstance();

// Helper functions for backward compatibility
export const connectWallet = (walletType: WalletType) => walletConnector.connectWallet(walletType);
export const getCurrentWalletState = () => walletConnector.getCurrentState();
export const disconnectWallet = () => walletConnector.disconnect();
export const switchChain = (chain: 'sepolia' | 'hedera') => walletConnector.switchNetwork(chain);
