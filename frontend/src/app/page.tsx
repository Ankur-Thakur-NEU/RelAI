'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import LockContractInterface from "@/components/LockContractInterface";
import WalletConnectionModal from "@/components/ConnectWalletModal";
import InteractiveBlob from "@/components/InteractiveBlob"; // Import the blob component
import { useMultiWallet } from '@/hooks/useMultiWallet';

export default function Home() {
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const { scrollYProgress } = useScroll();
  const router = useRouter();
  const { isConnected, isConnecting, address, formatAddress, chainId, getNetworkName } = useMultiWallet();
  
  // Transform values based on scroll
  const blobScale = useTransform(scrollYProgress, [0, 0.4], [0.5, 1.5]); // Blob max size at 0.4
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]); // Content appears earlier
  const contentScale = useTransform(scrollYProgress, [0.2, 0.5], [1.2, 1]); // Added for zoom out effect
  const dashboardOpacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]); // Scroll indicator stays until panel starts

  // Panel progress: starts after a large pause (at 0.9) after blob max size (0.4)
  const panelProgress = useTransform(scrollYProgress, (val) => Math.min(1, Math.max(0, (val - 0.9) / 0.1)));
  const panelY = useTransform(panelProgress, [0, 1], ['100%', '0%']);
  const headerOpacity = useTransform(panelProgress, [0.95, 1], [0, 1]);
  const panelOverflowY = useTransform(panelProgress, (val) => val >= 1 ? 'auto' : 'hidden');

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Auto-redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected && address) {
      console.log('[HOME] Wallet connected, redirecting to dashboard...');
      setTimeout(() => {
        router.push('/pages/dashboard');
      }, 2000); // Give user time to see they're connected
    }
  }, [isConnected, address, router]);

  // Cyberpunk images from Unsplash
  const cyberpunkImages = [
    'https://images.unsplash.com/photo-1723841630-fxjtvgrqevg?fm=jpg&w=1600&fit=max',
    'https://images.unsplash.com/photo-1723841630-7PqRZK6rbaE?fm=jpg&w=1600&fit=max',
    'https://images.unsplash.com/photo-1723841630-MFYlCoSm-0o?fm=jpg&w=1600&fit=max',
    'https://images.unsplash.com/photo-1723841630-p4Axj8Cwlk0?fm=jpg&w=1600&fit=max',
    'https://images.unsplash.com/photo-1723841630-71SHXwBLp5w?fm=jpg&w=1600&fit=max',
  ];

  // Sample trending tokens from screenshot (use API in production)
  const trendingTokens = [
    { name: 'ROOM (Backr...)', price: '$0.02', change: '+118.4%', logo: 'https://images.unsplash.com/photo-1723841630-fxjtvgrqevg?fm=jpg&w=100&fit=max', graphColor: 'green', trend: 'up' },
    { name: 'BoatKid (Pacu...)', price: '$0.01', change: '+50.1%', logo: 'https://images.unsplash.com/photo-1723841630-7PqRZK6rbaE?fm=jpg&w=100&fit=max', graphColor: 'green', trend: 'up' },
    { name: 'CTSI (Cartesi)', price: '$0.10', change: '+41.8%', logo: 'https://cryptologos.cc/logos/cartesi-ctsi-logo.png', graphColor: 'green', trend: 'up' },
    { name: 'BSX', price: '$0.05', change: '+78.7%', logo: 'https://images.unsplash.com/photo-1723841630-MFYlCoSm-0o?fm=jpg&w=100&fit=max', graphColor: 'green', trend: 'up' },
    { name: 'HODL Coin', price: '$0.05', change: '+43%', logo: 'https://images.unsplash.com/photo-1723841630-p4Axj8Cwlk0?fm=jpg&w=100&fit=max', graphColor: 'green', trend: 'up' },
    { name: 'ALU (Altura)', price: '$0.02', change: '+38.4%', logo: 'https://cryptologos.cc/logos/altura-alu-logo.png', graphColor: 'green', trend: 'up' },
  ];

  // Sample collections from screenshot (use API in production)
  const collections = [
    { name: 'Moonbirds', floor: '3.80 ETH', change: '+15.2%', logo: 'https://www.proof.xyz/assets/moonbirds-logo.png' },
    { name: 'Moonbirds Mythics', floor: '0.45 ETH', change: '+30.4%', logo: 'https://images.unsplash.com/photo-1723841630-7PqRZK6rbaE?fm=jpg&w=100&fit=max' },
    { name: 'Bored Ape Yacht Club', floor: '11.67 ETH', change: '-1.5%', logo: 'https://boredapeyachtclub.com/img/bayc-logo.png' },
    { name: 'Pudgy Penguins', floor: '13.12 ETH', change: '+4.4%', logo: 'https://www.pudgypenguins.com/static/media/logo.0b0b0b0b.png' },
    { name: 'CryptoPunks V1 (wrapped)', floor: '3.85 ETH', change: '-2.3%', logo: 'https://cryptopunks.app/public/images/cryptopunks/punk0001.png' },
    { name: 'Lil Pudgys', floor: '1.53 ETH', change: '-2.1%', logo: 'https://images.unsplash.com/photo-1723841630-p4Axj8Cwlk0?fm=jpg&w=100&fit=max' },
    { name: 'Azuki', floor: '2.07 ETH', change: '+1.5%', logo: 'https://www.azuki.com/static/media/logo.0b0b0b0b.png' },
    { name: 'CryptoPunks', floor: '49.50 ETH', change: '0%', logo: 'https://cryptopunks.app/public/images/cryptopunks/logo.png' },
    { name: 'LIFT (a self portrait by Snowfro)', floor: '0.29 ETH', change: '-23.7%', logo: 'https://images.unsplash.com/photo-1723841630-71SHXwBLp5w?fm=jpg&w=100&fit=max' },
    { name: 'Milady Maker', floor: '2.61 ETH', change: '+1.2%', logo: 'https://miladymaker.net/static/media/logo.0b0b0b0b.png' },
  ];

  // Function to generate simple SVG line graph
  const getLineGraphSVG = (trend) => {
    const path = trend === 'up' ? 'M0 50 L25 40 L50 30 L75 20 L100 10' : 'M0 10 L25 20 L50 30 L75 40 L100 50';
    const color = trend === 'up' ? 'green' : 'red';
    return (
      <svg width="100" height="50" viewBox="0 0 100 50">
        <path d={path} stroke={color} strokeWidth="2" fill="none" />
      </svg>
    );
  };

  return (
    <div className="relative">
      {/* Full viewport container for the UI frame */}
      <div className="h-[300vh] relative overflow-hidden bg-black">
        {/* Static UI Frame - All text elements */}
        <div className="fixed inset-0 z-20 pointer-events-none text-white font-mono">
          
          {/* Top Left - Version */}
          <div className="absolute top-12 left-12 text-sm">
            BETA: 2.1
          </div>
          
          {/* Top Center - Trust Sync with Progress Bar */}
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <span className="text-sm">TRUST-SYNC</span>
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Top Right - Build info */}
          <div className="absolute top-12 right-12 text-sm">
            VRSN: 11.0 REPUTATION-SYNC
          </div>
          
          {/* Left Side - Vertical Text */}
          <div className="absolute left-12 top-1/3 transform -rotate-90 origin-left text-xs space-y-2">
            <div>REPUTATION PROTOCOL v3.1</div>
            <div className="mt-8">TRUST LAYER: ACTIVE</div>
          </div>
          
          {/* Right Side - Vertical Text */}
          <div className="absolute right-12 top-1/4 transform rotate-90 origin-right text-xs">
            AGENT REGISTRY: 1247
          </div>
          <div className="absolute right-12 bottom-1/3 transform rotate-90 origin-right text-xs">
            CROSS-CHAIN CCIP ACTIVE-ON
          </div>
          
          {/* Bottom Left - Technical Specs */}
          <div className="absolute bottom-20 left-12 text-xs space-y-1 leading-tight">
            <div className="text-white/90">REPUTATION LAYERS | ACTIVE</div>
            <div className="text-white/80">DECENTRALIZED TRUST NETWORK</div>
            <div className="text-white/70">AGENT VERIFICATION</div>
            <div className="text-white/80">HEDERA / GRAPH / CHAINLINK</div>
            <div className="text-white/70">CROSS-CHAIN REGISTRY</div>
            <div className="text-white/80">REPUTATION SCORING MODEL</div>
            <div className="text-white/70">TRUST VALIDATION LAYER</div>
          </div>
          
          {/* Bottom Center - Protocol Info */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-sm">
            {/* PROTOCOL_V2: RELAI */}
          </div>
          
          {/* Bottom Right - Model Info */}
          <div className="absolute bottom-20 right-12 text-sm">
            TRUSTMODEL
          </div>
          
          {/* Bottom Right Corner - Additional Info */}
          <div className="absolute bottom-12 right-12 text-xs space-y-1 text-right">
            <div className="text-white/60">NETWORK STATUS</div>
            <div className="text-green-400">OPERATIONAL</div>
          </div>
          
          {/* Barcode - Bottom Left */}
          <div className="absolute bottom-4 left-12 flex space-x-px">
            {Array.from({length: 25}).map((_, i) => (
              <div 
                key={i} 
                className={`bg-white ${
                  i % 4 === 0 ? 'h-6 w-px' : 
                  i % 3 === 0 ? 'h-4 w-px' : 
                  i % 2 === 0 ? 'h-3 w-px' : 'h-2 w-px'
                }`} 
              />
            ))}
          </div>
          
          {/* Grid Lines - Decorative */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
            {/* Vertical lines */}
            <div className="absolute left-1/4 top-0 w-px h-full bg-white/20"></div>
            <div className="absolute left-3/4 top-0 w-px h-full bg-white/20"></div>
            {/* Horizontal lines */}
            <div className="absolute top-1/4 left-0 w-full h-px bg-white/20"></div>
            <div className="absolute top-3/4 left-0 w-full h-px bg-white/20"></div>
          </div>
          
          {/* Corner Brackets */}
          <div className="absolute top-8 left-8 w-6 h-6 border-l-2 border-t-2 border-white/40"></div>
          <div className="absolute top-8 right-8 w-6 h-6 border-r-2 border-t-2 border-white/40"></div>
          <div className="absolute bottom-8 left-8 w-6 h-6 border-l-2 border-b-2 border-white/40"></div>
          <div className="absolute bottom-8 right-8 w-6 h-6 border-r-2 border-b-2 border-white/40"></div>
        </div>

        {/* Center Space for Blob - Replaced the circle with InteractiveBlob */}
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <motion.div 
            style={{ scale: blobScale }}
            className="w-96 h-96 flex items-center justify-center"
          >
            {/* Interactive Blob Component */}
            <InteractiveBlob className="w-full h-full" />
          </motion.div>
        </div>

        {/* Content that appears when blob reaches max size */}
        <motion.div 
          style={{ 
            opacity: contentOpacity,
            scale: contentScale
          }}
          className="fixed inset-0 z-30 flex flex-col items-center justify-center pointer-events-none font-mono"
        >
          <div className="text-center space-y-8 pointer-events-auto">
            {/* Main Heading */}
            <motion.h1 
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-6xl md:text-8xl font-bold text-white tracking-tight"
            >
              RelAI
            </motion.h1>
            
            {/* Subtitle */}
            <motion.div 
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-300 max-w-md mx-auto"
            >
              <p>Decentralized Cross-Chain Reputation Registry for AI Agents</p>
            </motion.div>

            {/* Connect Wallet Button */}
            <motion.div
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="scale-75"
            >
              {!isConnected ? (
                <button 
                  onClick={openModal}
                  disabled={isConnecting}
                  className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-mono text-lg rounded-lg hover:bg-gradient-to-r hover:from-green-500 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-green-400/30 rounded-lg">
                    <div className="flex items-center gap-3 text-green-400 font-mono text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Connected: {formatAddress(address || '')}</span>
                      {chainId && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span>{getNetworkName(chainId)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/pages/dashboard')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-mono text-lg rounded-lg transition-colors flex items-center gap-2"
                  >
                    Access Dashboard
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  <div className="text-center text-sm text-gray-400 font-mono">
                    Redirecting to dashboard...
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator - Visible initially, fades out when panel starts */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30"
        >
          <div className="flex flex-col items-center text-white/60">
            <span className="text-sm mb-2">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-px h-8 bg-white/40"
            />
          </div>
        </motion.div>

        {/* Wallet Connection Modal */}
        <WalletConnectionModal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
        />

        {/* Full-screen Sliding Panel with Bento UI - Commented out */}
        {/* <motion.div
          style={{
            y: panelY,
            overflowY: panelOverflowY,
          }}
          className="fixed top-0 left-0 w-full h-full bg-black/80 backdrop-blur-xl z-40 text-white font-mono"
        >
          <motion.div
            style={{ opacity: headerOpacity }}
            className="sticky top-0 left-0 w-full h-16 bg-black/90 flex justify-between items-center px-8 z-50 border-b border-green-400/50"
          >
            <div className="text-2xl font-bold text-white">relAI</div>
            <button 
              onClick={openModal}
              className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white font-mono rounded-lg hover:bg-gradient-to-r hover:from-green-500 hover:to-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
          </motion.div>

          <div className="p-8 space-y-8 min-h-[200vh]">
            <div className="relative h-64 overflow-hidden rounded-2xl border border-purple-400/30">
              <motion.div
                className="flex"
                animate={{
                  x: [0, -cyberpunkImages.length * 100 + '%']
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 20,
                  ease: 'linear'
                }}
                style={{ width: `${cyberpunkImages.length * 100}%` }}
              >
                {cyberpunkImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Cyberpunk Art ${index + 1}`}
                    className="w-full h-64 object-cover"
                    style={{ width: `${100 / cyberpunkImages.length}%` }}
                  />
                ))}
              </motion.div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-blue-400/30">
              <h3 className="text-xl font-bold text-blue-400 mb-4">Trending Tokens</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendingTokens.map((token, index) => (
                  <div key={index} className="p-4 bg-black/50 rounded-xl flex items-center space-x-4">
                    <img src={token.logo} alt={`${token.name} logo`} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <p className="font-bold">{token.name}</p>
                      <p>{token.price} <span className={token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{token.change}</span></p>
                    </div>
                    {getLineGraphSVG(token.trend)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-green-400/30">
              <h3 className="text-xl font-bold text-green-400 mb-4">NFT 101</h3>
              <p className="text-gray-300 mb-4">Learn the basics of NFTs, how to create, buy, and sell them on platforms like OpenSea.</p>
              <a href="https://opensea.io/learn" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Read more on OpenSea Learn Center</a>
              <div className="h-64 bg-black/50 rounded-xl flex items-center justify-center mt-4">
                <img src={cyberpunkImages[0]} alt="NFT 101 Graphic" className="h-full w-full object-cover rounded-xl" />
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-purple-400/30">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Featured Collections</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {collections.map((collection, index) => (
                  <div key={index} className="p-4 bg-black/50 rounded-xl flex flex-col items-center">
                    <img src={collection.logo} alt={`${collection.name} logo`} className="h-32 w-32 object-cover rounded-md mb-2" />
                    <p className="font-bold text-center">{collection.name}</p>
                    <p className="text-center">Floor: {collection.floor} <span className={collection.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{collection.change}</span></p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-green-400/30 h-[100vh]">
              <h3 className="text-xl font-bold text-green-400 mb-4">More Content</h3>
              <p className="text-gray-300">This is additional content to make the panel scrollable. You can add more sections, videos, or graphics here.</p>
            </div>
          </div>

          <style jsx>{`
            @keyframes glitch {
              0% { transform: translate(0); }
              20% { transform: translate(-2px, 2px); }
              40% { transform: translate(2px, -2px); }
              60% { transform: translate(-2px, 2px); }
              80% { transform: translate(2px, -2px); }
              100% { transform: translate(0); }
            }
            .animate-glitch {
              animation: glitch 2s infinite;
            }
          `}</style>
        </motion.div> */}
      </div>
    </div>
  );
}