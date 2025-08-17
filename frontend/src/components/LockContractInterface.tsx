'use client';

import { useWallet } from '@/hooks/useWallet';
import { useLockContract } from '@/hooks/useLockContract';
import { formatEther } from '@/lib/web3';
import { useState } from 'react';

export default function LockContractInterface() {
  const { isConnected, address } = useWallet();
  const { unlockTime, owner, balance } = useLockContract();
  const isLoading = false; // Mock values for unused component
  const error = null;
  const withdraw = async () => console.log('Withdraw not implemented');
  const reload = () => console.log('Reload not implemented');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await withdraw();
    } catch (err) {
      console.error('Withdrawal failed:', err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatTimestamp = (timestamp: bigint | null) => {
    if (!timestamp) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const canWithdraw = () => {
    if (!unlockTime || !address || !isConnected) return false;
    const now = Math.floor(Date.now() / 1000);
    const isOwner = address.toLowerCase() === owner?.toLowerCase();
    const isUnlocked = now >= Number(unlockTime);
    return isOwner && isUnlocked;
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600 text-center">
          Please connect your wallet to interact with the contract
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lock Contract</h3>
          <button
            onClick={reload}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Contract Balance</h4>
            <p className="text-lg font-semibold text-blue-700">
              {balance !== null ? `${formatEther(balance)} ETH` : 'Loading...'}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-purple-900 mb-1">Unlock Time</h4>
            <p className="text-sm text-purple-700">
              {formatTimestamp(BigInt(unlockTime))}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-1">Owner</h4>
            <p className="text-xs text-green-700 break-all">
              {owner || 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Actions</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Withdraw Funds</h5>
              <p className="text-sm text-gray-600">
                {canWithdraw() 
                  ? 'You can withdraw the funds now' 
                  : 'Only the owner can withdraw after the unlock time'
                }
              </p>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={!canWithdraw() || isWithdrawing}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isWithdrawing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Withdrawing...
                </>
              ) : (
                'Withdraw'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Note</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This is a demo contract. Make sure the contract is deployed and the address is configured in your environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}