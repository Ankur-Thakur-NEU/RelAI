'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import { WalletType, SUPPORTED_WALLETS, isWalletInstalled, getInstallUrl } from '@/lib/walletConfig';

// Enhanced Toast Component
const ToastNotification = ({ 
  message, 
  isVisible, 
  onClose, 
  duration = 3000, 
  type = 'success' 
}: {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const colors = {
    success: 'text-green-400 border-green-400/30',
    error: 'text-red-400 border-red-400/30',
    info: 'text-blue-400 border-blue-400/30',
  };

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
      <div className={`bg-black/60 backdrop-blur-xl border rounded-lg p-4 shadow-2xl ${colors[type]}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            type === 'success' ? 'bg-green-400' : 
            type === 'error' ? 'bg-red-400' : 'bg-blue-400'
          }`}></div>
          <span className="font-mono text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
};

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getWalletIcon = (type: string) => {
  switch (type) {
    case 'metamask': 
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="12" fill="#0052ff"/>
          <rect x="8" y="8" width="8" height="8" rx="2" fill="white"/>
        </svg>
      );
    case 'walletconnect':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#3b99fc"/>
          <path d="M7.5 9c2.5-2.5 6.5-2.5 9 0l.5.5c.1.1.1.3 0 .4l-1 1c-.1.1-.2.1-.3 0l-.7-.7c-1.5-1.5-4-1.5-5.5 0l-.7.7c-.1.1-.2.1-.3 0l-1-1c-.1-.1-.1-.3 0-.4L7.5 9z" fill="white"/>
          <path d="M17 12.5l1 1c.1.1.1.3 0 .4L15.5 16c-.1.1-.3.1-.4 0l-2.6-2.6c-.1-.1-.1-.1-.2 0L9.7 16c-.1.1-.3.1-.4 0L7 13.9c-.1-.1-.1-.3 0-.4l1-1c.1-.1.3-.1.4 0l2.6 2.6c0 .1.1.1.2 0l2.6-2.6c.1-.1.3-.1.4 0z" fill="white"/>
        </svg>
      );
    case 'abstract':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#8b5cf6"/>
          <circle cx="12" cy="8" r="2" fill="white"/>
          <rect x="8" y="12" width="8" height="2" rx="1" fill="white"/>
          <rect x="10" y="16" width="4" height="2" rx="1" fill="white"/>
        </svg>
      );
    default: 
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#6366f1"/>
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">W</text>
        </svg>
      );
  }
};

export default function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const [email, setEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [isClosing, setIsClosing] = useState(false);
  
  const router = useRouter();
  const { 
    connect, 
    isConnecting, 
    error: walletError, 
    address, 
    isConnected,
    walletType,
    chainId,
    getNetworkName,
    formatAddress 
  } = useMultiWallet();

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address) {
      const networkName = chainId ? getNetworkName(chainId) : 'Unknown';
      setToastMessage(`WALLET CONNECTED - ${walletType?.toUpperCase()} ON ${networkName.toUpperCase()}`);
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
          router.push('/pages/dashboard');
        }, 500);
      }, 2000);
    }
  }, [isConnected, address, chainId, walletType, onClose, router, getNetworkName]);

  // Handle wallet errors
  useEffect(() => {
    if (walletError) {
      setToastMessage(walletError);
      setToastType('error');
      setShowToast(true);
    }
  }, [walletError]);

  if (!isOpen && !isClosing) return null;

  const handleWalletConnect = async (selectedWalletType: WalletType) => {
    if (isConnecting) return;

    console.log(`[WALLET] User selected ${selectedWalletType} wallet`);

    // Check if wallet is installed (except WalletConnect)
    if (!isWalletInstalled(selectedWalletType) && selectedWalletType !== 'walletconnect') {
      setToastMessage(`${selectedWalletType.toUpperCase()} NOT INSTALLED`);
      setToastType('error');
      setShowToast(true);

      // Open install URL after a delay
      setTimeout(() => {
        const installUrl = getInstallUrl(selectedWalletType);
        if (installUrl) {
          window.open(installUrl, '_blank');
        }
      }, 1500);
      return;
    }

    try {
      setToastMessage(`CONNECTING TO ${selectedWalletType.toUpperCase()}...`);
      setToastType('info');
      setShowToast(true);

      await connect(selectedWalletType);
      // Success is handled by useEffect above
    } catch (err: unknown) {
      console.error(`[ERROR] Connection failed:`, err);
      // Error is handled by useEffect above
    }
  };

  const handleEmailSubmit = () => {
    if (email && !isConnecting) {
      setToastMessage('EMAIL AUTHENTICATION - FEATURE COMING SOON');
      setToastType('info');
      setShowToast(true);

      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
          router.push('/pages/dashboard');
        }, 500);
      }, 2000);
    }
  };

  // Enhanced wallet options with real-time installation status
  const walletOptionsWithStatus = SUPPORTED_WALLETS.map(wallet => ({
    ...wallet,
    isInstalled: isWalletInstalled(wallet.type) || wallet.type === 'walletconnect',
    isConnecting: isConnecting,
  }));

  return (
    <>
      {/* Backdrop with fade-out animation */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className={`relative w-full max-w-lg mx-4 animate-in zoom-in-95 duration-300 transition-opacity duration-500 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="bg-black/60 backdrop-blur-xl rounded-lg border border-gray-600/30 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative border-b border-gray-600/30">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white font-mono">RelAI</h2>
                  {isConnected && address && (
                    <div className="text-sm text-green-400 font-mono">
                      {formatAddress(address)}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="group w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-400 transition-all duration-200"
                  disabled={isConnecting}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="group-hover:rotate-90 transition-transform"
                  >
                    <path d="M12.207 4.207a1 1 0 0 0-1.414-1.414L8 5.586 5.207 2.793a1 1 0 0 0-1.414 1.414L6.586 7l-2.793 2.793a1 1 0 1 0 1.414 1.414L8 8.414l2.793 2.793a1 1 0 0 0 1.414-1.414L9.414 7l2.793-2.793z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-8">
                <p className="text-gray-400 font-mono text-sm">
                  Connect your wallet to access the<br />
                  Cross-Chain AI Agent Reputation Network
                </p>
              </div>

              {/* Wallet Options */}
              <div className="space-y-3 mb-8">
                {walletOptionsWithStatus.map((wallet, index) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleWalletConnect(wallet.type)}
                    disabled={isConnecting}
                    className={`group w-full flex items-center gap-4 p-4 rounded border transition-all duration-300 backdrop-blur-sm disabled:opacity-50 ${
                      wallet.isInstalled 
                        ? 'bg-black/40 hover:bg-black/60 border-gray-600/30 hover:border-green-400/50' 
                        : 'bg-black/20 hover:bg-black/40 border-gray-600/20 hover:border-yellow-400/50'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getWalletIcon(wallet.type)}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <span className="text-white font-mono text-sm block">{wallet.name}</span>
                      {!wallet.isInstalled && wallet.type !== 'walletconnect' && (
                        <span className="text-yellow-400 font-mono text-xs">Not installed - Click to install</span>
                      )}
                    </div>

                    <div className={`transition-colors ${
                      wallet.isInstalled 
                        ? 'text-gray-500 group-hover:text-green-400' 
                        : 'text-yellow-400'
                    }`}>
                      {isConnecting ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="group-hover:translate-x-1 transition-all"
                        >
                          <path d="M8.146 5.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.793 8.5H4.5a.5.5 0 0 1 0-1h6.293L8.146 5.854a.5.5 0 0 1 0-.708z" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center my-8">
                <div className="flex-1 h-px bg-gray-600/30"></div>
                <span className="px-3 text-xs text-gray-500 font-mono">OR CONTINUE WITH EMAIL</span>
                <div className="flex-1 h-px bg-gray-600/30"></div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-black/40 border border-gray-600/30 rounded text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none font-mono text-sm transition-all duration-300 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    disabled={isConnecting}
                  />
                </div>
                <button
                  onClick={handleEmailSubmit}
                  disabled={isConnecting}
                  className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-black font-mono text-sm font-bold rounded transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="group-hover:translate-x-0.5 transition-transform"
                  >
                    <path d="M8.146 5.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.793 8.5H4.5a.5.5 0 0 1 0-1h6.293L8.146 5.854a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </div>

              {/* Status Display */}
              <div className="mt-8 flex justify-between items-center text-xs font-mono text-gray-500">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isConnected ? 'bg-green-400' : 
                    isConnecting ? 'bg-yellow-400' : 'bg-gray-400'
                  }`}></div>
                  <span>
                    STATUS: {isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING...' : 'READY'}
                  </span>
                </div>
                <div>
                  <span>SECURITY: ENCRYPTED</span>
                </div>
              </div>

              {/* Network Display */}
              {chainId && (
                <div className="mt-2 text-center">
                  <span className="text-xs font-mono text-gray-400">
                    NETWORK: {getNetworkName(chainId).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastNotification
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
        duration={toastType === 'error' ? 5000 : 3000}
      />
    </>
  );
}
