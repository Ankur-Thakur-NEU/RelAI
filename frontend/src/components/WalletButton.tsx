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
      case 'metamask': 
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#f6851b"/>
            <path d="M20.5 4.5L13 9.5L14.5 6L20.5 4.5Z" fill="#e2761b" stroke="#e2761b" strokeWidth="0.1"/>
            <path d="M3.5 4.5L11 9.5L9.5 6L3.5 4.5Z" fill="#e4761b" stroke="#e4761b" strokeWidth="0.1"/>
            <path d="M18 15.5L15.5 19L20 20L21.5 15.5H18Z" fill="#f6851b" stroke="#f6851b" strokeWidth="0.1"/>
            <path d="M2.5 15.5L4 20L8.5 19L6 15.5H2.5Z" fill="#f6851b" stroke="#f6851b" strokeWidth="0.1"/>
            <path d="M8 12.5L6.5 15L9.5 15.5L8 12.5Z" fill="#763d16" stroke="#763d16" strokeWidth="0.1"/>
            <path d="M16 12.5L17.5 15L14.5 15.5L16 12.5Z" fill="#763d16" stroke="#763d16" strokeWidth="0.1"/>
            <path d="M8.5 19L11 17.5L9 15.5L8.5 19Z" fill="#e4761b" stroke="#e4761b" strokeWidth="0.1"/>
            <path d="M15.5 19L13 17.5L15 15.5L15.5 19Z" fill="#e4761b" stroke="#e4761b" strokeWidth="0.1"/>
          </svg>
        );
      case 'coinbase':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="12" fill="#0052ff"/>
            <rect x="8" y="8" width="8" height="8" rx="2" fill="white"/>
          </svg>
        );
      case 'walletconnect':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#3b99fc"/>
            <path d="M7.5 9c2.5-2.5 6.5-2.5 9 0l.5.5c.1.1.1.3 0 .4l-1 1c-.1.1-.2.1-.3 0l-.7-.7c-1.5-1.5-4-1.5-5.5 0l-.7.7c-.1.1-.2.1-.3 0l-1-1c-.1-.1-.1-.3 0-.4L7.5 9z" fill="white"/>
            <path d="M17 12.5l1 1c.1.1.1.3 0 .4L15.5 16c-.1.1-.3.1-.4 0l-2.6-2.6c-.1-.1-.1-.1-.2 0L9.7 16c-.1.1-.3.1-.4 0L7 13.9c-.1-.1-.1-.3 0-.4l1-1c.1-.1.3-.1.4 0l2.6 2.6c0 .1.1.1.2 0l2.6-2.6c.1-.1.3-.1.4 0z" fill="white"/>
          </svg>
        );
      case 'abstract':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#8b5cf6"/>
            <circle cx="12" cy="8" r="2" fill="white"/>
            <rect x="8" y="12" width="8" height="2" rx="1" fill="white"/>
            <rect x="10" y="16" width="4" height="2" rx="1" fill="white"/>
          </svg>
        );
      default: 
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#6366f1"/>
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">W</text>
          </svg>
        );
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
