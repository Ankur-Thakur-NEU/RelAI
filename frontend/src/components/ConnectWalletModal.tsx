'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ToastNotification from './ToastNotification';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const [email, setEmail] = useState('');
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const navigateToDashboard = () => {
    router.push('/pages/dashboard');
  };

  const handleEmailSubmit = () => {
    if (email) {
      console.log('Email submitted:', email);
      setShowToast(true);
      setTimeout(() => {
        onClose();
        navigateToDashboard();
      }, 500);
    }
  };

  const handleWalletConnect = (walletType: string) => {
    console.log('Connecting to:', walletType);
    setShowToast(true);
    setTimeout(() => {
      onClose();
      navigateToDashboard();
    }, 500);
  };

  const handleBackToOptions = () => {
    setShowWalletConnect(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-gray-700/50">
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              {showWalletConnect && (
                <button 
                  onClick={handleBackToOptions}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors mr-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8.146 5.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.793 8.5H4.5a.5.5 0 0 1 0-1h6.293L8.146 5.854a.5.5 0 0 1 0-.708z" transform="rotate(180 8 8)"/>
                  </svg>
                </button>
              )}
              {/* <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                R
              </div> */}
              <h2 className="text-xl font-semibold text-white">
                {showWalletConnect ? 'Connect Wallet' : 'Connect with RelAI'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.207 4.207a1 1 0 0 0-1.414-1.414L8 5.586 5.207 2.793a1 1 0 0 0-1.414 1.414L6.586 7l-2.793 2.793a1 1 0 1 0 1.414 1.414L8 8.414l2.793 2.793a1 1 0 0 0 1.414-1.414L9.414 7l2.793-2.793z"/>
              </svg>
            </button>
          </div>

          <div className="p-6">
            {showWalletConnect ? (
              <div className="space-y-4">
                <div className="text-center">
                  <button 
                    onClick={handleBackToOptions}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back to wallet options
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <button 
                    onClick={() => handleWalletConnect('MetaMask')}
                    className="w-full flex items-center gap-4 p-4 bg-[#202020] hover:bg-[#2a2a2a] rounded-lg transition-colors border border-gray-700/30"
                  >
                    <img src="/logo/metamask_wallet.svg" alt="MetaMask" className="w-8 h-8" />
                    <span className="text-white font-medium">MetaMask</span>
                  </button>

                  <button 
                    onClick={() => handleWalletConnect('Coinbase')}
                    className="w-full flex items-center gap-4 p-4 bg-[#202020] hover:bg-[#2a2a2a] rounded-lg transition-colors border border-gray-700/30"
                  >
                    <img src="/logo/coinbase_wallet.svg" alt="Coinbase" className="w-8 h-8" />
                    <span className="text-white font-medium">Coinbase Wallet</span>
                  </button>

                  <button 
                    onClick={() => handleWalletConnect('Abstract')}
                    className="w-full flex items-center gap-4 p-4 bg-[#202020] hover:bg-[#2a2a2a] rounded-lg transition-colors border border-gray-700/30"
                  >
                    <img src="/logo/abstract_wallet.svg" alt="Abstract" className="w-8 h-8" />
                    <span className="text-white font-medium">Abstract</span>
                  </button>

                  <button 
                    onClick={() => handleWalletConnect('WalletConnect')}
                    className="w-full flex items-center gap-4 p-4 bg-[#202020] hover:bg-[#2a2a2a] rounded-lg transition-colors border border-gray-700/30"
                  >
                    <img src="/logo/walletconnect_wallet.svg" alt="WalletConnect" className="w-8 h-8" />
                    <span className="text-white font-medium">WalletConnect</span>
                  </button>
                </div>

                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-gray-700"></div>
                  <span className="px-3 text-sm text-gray-400">or continue with email</span>
                  <div className="flex-1 border-t border-gray-700"></div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Continue with email"
                    className="flex-1 px-4 py-3 bg-[#202020] border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  />
                  <button 
                    onClick={handleEmailSubmit}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.146 5.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.793 8.5H4.5a.5.5 0 0 1 0-1h6.293L8.146 5.854a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ToastNotification
        message="Wallet connected 🎉"
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
        position="top-right"
      />
    </>
  );
}