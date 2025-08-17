"use client";

import { useState, useEffect, useCallback } from 'react';
import { WalletType, ExtendedWalletState, isWalletInstalled } from '@/lib/walletConfig';
import { walletConnector } from '@/lib/multiWallet';

export const useMultiWallet = () => {
  const [walletState, setWalletState] = useState<ExtendedWalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    walletType: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to specific wallet
  const connect = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if wallet is installed
      if (!isWalletInstalled(walletType) && walletType !== 'walletconnect') {
        throw new Error(`${walletType} is not installed. Please install it first.`);
      }

      console.log(`[CONNECTING] Connecting to ${walletType}...`);
      const state = await walletConnector.connectWallet(walletType);
      setWalletState(state);
      
      // Save wallet preference
      localStorage.setItem('preferredWallet', walletType);
      
      console.log(`[SUCCESS] Successfully connected to ${walletType}`);
      return state;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to connect to ${walletType}`;
      setError(errorMessage);
      console.error(`[ERROR] Connection error:`, err);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await walletConnector.disconnect();
      setWalletState({
        address: null,
        isConnected: false,
        chainId: null,
        walletType: null,
      });
      
      // Clear stored preference
      localStorage.removeItem('preferredWallet');
      
      console.log('[DISCONNECT] Disconnected from wallet');
    } catch (err) {
      console.error('[ERROR] Disconnect error:', err);
      setError('Failed to disconnect wallet');
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (network: 'sepolia' | 'hedera') => {
    setError(null);
    
    try {
      await walletConnector.switchNetwork(network);
      // Update state after successful network switch
      await updateWalletState();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to switch to ${network} network`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Update wallet state
  const updateWalletState = useCallback(async () => {
    try {
      const state = await walletConnector.getCurrentState();
      setWalletState(state);
    } catch (err) {
      console.error('[ERROR] Error updating wallet state:', err);
    }
  }, []);

  // Check existing connection state on page load (no auto-reconnect)
  useEffect(() => {
    const checkConnectionState = async () => {
      try {
        // Only check current state, don't try to reconnect
        const currentState = await walletConnector.getCurrentState();
        if (currentState.isConnected) {
          setWalletState(currentState);
        }
      } catch (err) {
        console.log(`[INFO] No existing connection found`);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      checkConnectionState();
    }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        updateWalletState();
      }
    };

    const handleChainChanged = () => {
      updateWalletState();
    };

    const handleDisconnect = () => {
      disconnect();
    };

    // Add event listeners with proper type handling
    const onAccountsChanged = (...args: unknown[]) => handleAccountsChanged(args[0] as string[]);
    const onChainChanged = (...args: unknown[]) => handleChainChanged();
    const onDisconnect = (...args: unknown[]) => handleDisconnect();

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    window.ethereum.on('disconnect', onDisconnect);

    return () => {
      // Cleanup event listeners
      window.ethereum?.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum?.removeListener('chainChanged', onChainChanged);
      window.ethereum?.removeListener('disconnect', onDisconnect);
    };
  }, [disconnect, updateWalletState]);

  // Helper functions
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isCorrectNetwork = (targetChain: 'sepolia' | 'hedera'): boolean => {
    const targetChainId = targetChain === 'sepolia' ? 11155111 : 296;
    return walletState.chainId === targetChainId;
  };

  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 11155111: return 'Sepolia';
      case 296: return 'Hedera Testnet';
      case 1: return 'Ethereum';
      default: return `Chain ${chainId}`;
    }
  };

  return {
    // Wallet state
    ...walletState,
    
    // Connection state
    isConnecting,
    error,
    
    // Actions
    connect,
    disconnect,
    switchNetwork,
    updateWalletState,
    
    // Utilities
    formatAddress,
    isCorrectNetwork,
    getNetworkName,
    
    // Wallet availability checks
    isMetaMaskInstalled: () => isWalletInstalled('metamask'),
    isCoinbaseInstalled: () => isWalletInstalled('coinbase'),
    isAbstractInstalled: () => isWalletInstalled('abstract'),
  };
};
