'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import LockContractInterface from "@/components/LockContractInterface";
import ConnectWalletModal from "@/components/ConnectWalletModal";

export default function Home() {
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const { scrollYProgress } = useScroll();
  
  // Transform values based on scroll
  const blobScale = useTransform(scrollYProgress, [0, 0.5], [0.5, 1.5]);
  const contentOpacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const contentScale = useTransform(scrollYProgress, [0.3, 0.6], [1.2, 1]); // Added for zoom out effect
  const dashboardOpacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="relative">
      {/* Full viewport container for the UI frame */}
      <div className="h-[200vh] relative overflow-hidden bg-black">
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

        {/* Center Space for Blob - This is where your Spline blob will go */}
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <motion.div 
            style={{ scale: blobScale }}
            className="w-96 h-96 flex items-center justifying-center"
          >
            {/* Placeholder for your blob - replace with Spline component */}
            <div className="w-full h-full rounded-full border-2 border-white/20 border-dashed flex items-center justify-center">
              <span className="text-white/40 text-sm"></span>
            </div>
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
              <button 
                onClick={openModal}
                className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-mono text-lg rounded-lg hover:bg-gradient-to-r hover:from-green-500 hover:to-blue-600 transition-colors"
              >
                Connect Wallet
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator - Visible initially, fades out */}
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
      </div>

      {/* Connect Wallet Modal */}
      <ConnectWalletModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
}