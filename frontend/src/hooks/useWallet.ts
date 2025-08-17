"use client";

import { useState, useEffect, useCallback } from "react";
import { WalletState, connectWallet, getWalletState, formatAddress } from "@/lib/web3";

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const state = await connectWallet();
      setWalletState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      console.error("Wallet connection error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWalletState = useCallback(async () => {
    try {
      const state = await getWalletState();
      setWalletState(state);
    } catch (err) {
      console.error("Error updating wallet state:", err);
    }
  }, []);

  useEffect(() => {
    updateWalletState();
  }, [updateWalletState]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletState({ address: null, isConnected: false, chainId: null });
      } else {
        updateWalletState();
      }
    };

    const handleChainChanged = () => updateWalletState();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [updateWalletState]);

  return { ...walletState, isLoading, error, connect, updateWalletState, formatAddress };
};
