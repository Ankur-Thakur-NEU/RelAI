'use client';

import { useState, useEffect, useCallback } from 'react';
import { createLockContract, createLockContractReadOnly, LockContract } from '@/lib/contracts';
import { useWallet } from './useWallet';

interface LockContractState {
  unlockTime: bigint | null;
  owner: string | null;
  balance: bigint | null;
}

export const useLockContract = () => {
  const { isConnected } = useWallet();
  const [contractState, setContractState] = useState<LockContractState>({
    unlockTime: null,
    owner: null,
    balance: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<LockContract | null>(null);

  // Initialize contract
  const initializeContract = useCallback(async () => {
    try {
      const contractInstance = isConnected 
        ? await createLockContract()
        : createLockContractReadOnly();
      
      setContract(contractInstance);
      return contractInstance;
    } catch (err) {
      console.error('Error initializing contract:', err);
      return null;
    }
  }, [isConnected]);

  // Load contract data
  const loadContractData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contractInstance = contract || await initializeContract();
      if (!contractInstance) {
        throw new Error('Contract not available');
      }

      const [unlockTime, owner, balance] = await Promise.all([
        contractInstance.getUnlockTime(),
        contractInstance.getOwner(),
        contractInstance.getBalance(),
      ]);

      setContractState({
        unlockTime,
        owner,
        balance,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contract data';
      setError(errorMessage);
      console.error('Contract data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contract, initializeContract]);

  // Withdraw funds
  const withdraw = useCallback(async () => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = await contract.withdraw();
      await tx.wait(); // Wait for transaction confirmation
      
      // Reload contract data after successful withdrawal
      await loadContractData();
      
      return tx;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMessage);
      console.error('Withdrawal error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, loadContractData]);

  // Initialize contract and load data when wallet connection changes
  useEffect(() => {
    initializeContract().then(() => {
      loadContractData();
    });
  }, [isConnected, initializeContract, loadContractData]);

  // Set up event listeners
  useEffect(() => {
    if (!contract) return;

    const handleWithdrawal = (amount: bigint, when: bigint) => {
      console.log('Withdrawal event:', { amount, when });
      // Reload contract data when withdrawal occurs
      loadContractData();
    };

    contract.onWithdrawal(handleWithdrawal);

    return () => {
      contract.removeAllListeners();
    };
  }, [contract, loadContractData]);

  return {
    ...contractState,
    isLoading,
    error,
    withdraw,
    reload: loadContractData,
  };
};