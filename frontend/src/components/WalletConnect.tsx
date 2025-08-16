'use client';

import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/web3';

export default function WalletConnect() {
  const { address, isConnected, chainId, isLoading, error, connect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
        <div>
          <p className="text-sm text-green-700">
            <span className="font-medium">Connected:</span> {formatAddress(address)}
          </p>
          <p className="text-xs text-green-600">
            Chain ID: {chainId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Connect your MetaMask wallet to interact with the smart contract
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <button
          onClick={connect}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            'Connect MetaMask'
          )}
        </button>
      </div>
    </div>
  );
}