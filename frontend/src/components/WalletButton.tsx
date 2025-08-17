'use client';

import { useState } from 'react';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import ConnectWalletModal from './ConnectWalletModal';

interface WalletButtonProps {
  className?: string;
  showBalance?: boolean;
  showNetwork?: boolean;
}

export default function WalletButton({ 
  className = '', 
  showBalance = false,
  showNetwork = true 
}: WalletButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    address,
    isConnected,
    isConnecting,
    walletType,
    chainId,
    balance,
    disconnect,
    formatAddress,
    getNetworkName,
    error
  } = useMultiWallet();

  const handleConnectClick = () => {
    if (isConnected) {
      // Show disconnect options or disconnect directly
      disconnect();
    } else {
      setIsModalOpen(true);
    }
  };

  const getWalletIcon = (type: string | null) => {
    switch (type) {
      case 'metamask': return 'M';
      case 'coinbase': return 'C';
      case 'walletconnect': return 'W';
      case 'abstract': return 'A';
      default: return 'W';
    }
  };

  const getNetworkColor = (chainId: number | null) => {
    switch (chainId) {
      case 11155111: return 'text-green-400'; // Sepolia
      case 296: return 'text-purple-400';     // Hedera
      case 1: return 'text-blue-400';         // Ethereum mainnet
      default: return 'text-yellow-400';      // Unknown/unsupported
    }
  };

  if (isConnecting) {
    return (
      <button
        className={`flex items-center gap-3 px-4 py-2 bg-black/40 border border-gray-600/30 rounded-lg font-mono text-sm text-gray-400 backdrop-blur-sm ${className}`}
        disabled
      >
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Main wallet info */}
        <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-green-400/30 rounded-lg font-mono text-sm text-white backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getWalletIcon(walletType)}</span>
            <span className="text-green-400">{formatAddress(address)}</span>
          </div>
          
          {showBalance && balance && (
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <span>|</span>
              <span>{parseFloat(balance).toFixed(4)} ETH</span>
            </div>
          )}
          
          {showNetwork && chainId && (
            <div className={`flex items-center gap-1 text-xs ${getNetworkColor(chainId)}`}>
              <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
              <span>{getNetworkName(chainId)}</span>
            </div>
          )}
        </div>

        {/* Disconnect button */}
        <button
          onClick={disconnect}
          className="p-2 bg-black/40 hover:bg-red-500/20 border border-gray-600/30 hover:border-red-400/50 rounded-lg text-gray-400 hover:text-red-400 transition-all duration-200 backdrop-blur-sm"
          title="Disconnect wallet"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.5a.5.5 0 0 0 0-1H3V4h4.5a.5.5 0 0 0 0-1H3z"/>
            <path d="m9.854 7.146 2.5-2.5a.5.5 0 0 1 .708.708L11.707 7H15.5a.5.5 0 0 1 0 1h-3.793l1.355 1.354a.5.5 0 0 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleConnectClick}
        className={`flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-black font-mono text-sm font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl ${className}`}
      >
        <span>W</span>
        <span>Connect Wallet</span>
      </button>

      <ConnectWalletModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// Compact version for navigation bars
export function CompactWalletButton({ className = '' }: { className?: string }) {
  return (
    <WalletButton 
      className={className}
      showBalance={false}
      showNetwork={true}
    />
  );
}

// Full version for dashboard
export function FullWalletButton({ className = '' }: { className?: string }) {
  return (
    <WalletButton 
      className={className}
      showBalance={true}
      showNetwork={true}
    />
  );
}
