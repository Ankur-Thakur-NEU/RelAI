'use client';

import { useState, useEffect, useCallback } from 'react';
import { WalletState, connectWallet, getWalletState } from '@/lib/web3';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const state = await connectWallet();
      setWalletState(state);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update wallet state
  const updateWalletState = useCallback(async () => {
    try {
      const state = await getWalletState();
      setWalletState(state);
    } catch (err) {
      console.error('Error updating wallet state:', err);
    }
  }, []);

  // Initialize wallet state on component mount
  useEffect(() => {
    updateWalletState();
  }, [updateWalletState]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setWalletState({
          address: null,
          isConnected: false,
          chainId: null,
        });
      } else {
        updateWalletState();
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      updateWalletState();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [updateWalletState]);

  return {
    ...walletState,
    isLoading,
    error,
    connect,
    updateWalletState,
  };
};