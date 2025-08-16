import WalletConnect from '@/components/WalletConnect';
import LockContractInterface from '@/components/LockContractInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Web3 DApp Interface
          </h1>
          <p className="text-gray-600">
            Connect your wallet and interact with the Lock smart contract
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          <WalletConnect />
          <LockContractInterface />
        </div>

        <footer className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Built with Next.js, TypeScript, and ethers.js
          </p>
        </footer>
      </div>
    </div>
  );
}
