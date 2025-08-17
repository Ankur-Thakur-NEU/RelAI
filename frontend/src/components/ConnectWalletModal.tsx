'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ToastNotification component
const ToastNotification = ({ message = 'WALLET CONNECTED - ACCESS GRANTED', isVisible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-black/40 backdrop-blur-xl border border-gray-600/30 rounded-lg p-4 shadow-2xl">
        <div className="flex items-center gap-3 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
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

export default function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const [email, setEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // For smooth transition
  const router = useRouter();

  if (!isOpen && !isClosing) return null;

  const navigateToDashboard = () => {
    console.log(`[${new Date().toISOString()}] Attempting navigation to /pages/dashboard`);
    try {
      router.push('/pages/dashboard');
      console.log(`[${new Date().toISOString()}] Navigation to /pages/dashboard triggered`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Navigation error:`, error);
    }
  };

  const handleEmailSubmit = () => {
    if (email && !isProcessing) {
      setIsProcessing(true);
      console.log(`[${new Date().toISOString()}] Email submitted:`, email);
      setShowToast(true);
      setTimeout(() => {
        setIsClosing(true); // Start closing animation
        setTimeout(() => {
          onClose();
          navigateToDashboard();
          setIsProcessing(false);
        }, 500); // Match the fade-out duration
      }, 3000);
    }
  };

  const handleWalletConnect = (walletType: string) => {
    if (!isProcessing) {
      setIsProcessing(true);
      console.log(`[${new Date().toISOString()}] Connecting to:`, walletType);
      setShowToast(true);
      setTimeout(() => {
        setIsClosing(true); // Start closing animation
        setTimeout(() => {
          onClose();
          navigateToDashboard();
          setIsProcessing(false);
        }, 500); // Match the fade-out duration
      }, 3000);
    }
  };

  const walletOptions = [
    { name: 'MetaMask', icon: '🦊' },
    { name: 'Coinbase Wallet', icon: '🔵' },
    { name: 'Abstract', icon: '🔷' },
    { name: 'WalletConnect', icon: '🔗' }
  ];

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
                </div>
                <button
                  onClick={onClose}
                  className="group w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-400 transition-all duration-200"
                  disabled={isProcessing}
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
                  Decentralized AI Agent Network
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {walletOptions.map((wallet, index) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleWalletConnect(wallet.name)}
                    disabled={isProcessing}
                    className="group w-full flex items-center gap-4 p-4 bg-black/40 hover:bg-black/60 rounded border border-gray-600/30 hover:border-green-400/50 transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-8 h-8 flex items-center justify-center text-xl">{wallet.icon}</div>
                    <span className="text-white font-mono text-sm flex-1 text-left">{wallet.name}</span>
                    <div className="text-gray-500 group-hover:text-green-400 transition-colors">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="group-hover:translate-x-1 transition-all"
                      >
                        <path d="M8.146 5.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.793 8.5H4.5a.5.5 0 0 1 0-1h6.293L8.146 5.854a.5.5 0 0 1 0-.708z" />
                      </svg>
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
                  />
                </div>
                <button
                  onClick={handleEmailSubmit}
                  disabled={isProcessing}
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

              <div className="mt-8 flex justify-between items-center text-xs font-mono text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>NETWORK: ACTIVE</span>
                </div>
                <div>
                  <span>CONNECTION: SECURE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastNotification
        message="WALLET CONNECTED - ACCESS GRANTED"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}