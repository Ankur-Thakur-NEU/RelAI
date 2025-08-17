import { ethers } from 'ethers';

// Types
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
}

// Ethereum provider check
export const hasEthereum = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Get provider
export const getProvider = (): ethers.BrowserProvider | null => {
  if (!hasEthereum()) {
    console.error('MetaMask is not installed');
    return null;
  }
  
  return new ethers.BrowserProvider(window.ethereum!);
};

// Get signer
export const getSigner = async (): Promise<ethers.JsonRpcSigner | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
};

// Connect wallet
export const connectWallet = async (): Promise<WalletState> => {
  if (!hasEthereum()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = getProvider()!;
    
    // Request account access
    await window.ethereum!.request({ 
      method: 'eth_requestAccounts' 
    });
    
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    
    return {
      address,
      isConnected: true,
      chainId: Number(network.chainId),
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

// Get current wallet state
export const getWalletState = async (): Promise<WalletState> => {
  if (!hasEthereum()) {
    return {
      address: null,
      isConnected: false,
      chainId: null,
    };
  }

  try {
    const provider = getProvider()!;
    const accounts = await provider.listAccounts();
    
    if (accounts.length === 0) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
      };
    }

    const network = await provider.getNetwork();
    
    return {
      address: accounts[0].address,
      isConnected: true,
      chainId: Number(network.chainId),
    };
  } catch (error) {
    console.error('Error getting wallet state:', error);
    return {
      address: null,
      isConnected: false,
      chainId: null,
    };
  }
};

// Format address for display
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format ether amount
export const formatEther = (wei: bigint): string => {
  return ethers.formatEther(wei);
};

// Parse ether amount
export const parseEther = (ether: string): bigint => {
  return ethers.parseEther(ether);
};