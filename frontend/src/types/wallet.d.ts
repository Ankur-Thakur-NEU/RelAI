// Wallet type definitions for window.ethereum and other wallet providers

interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isAbstract?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress?: string;
  chainId?: string;
  networkVersion?: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    coinbaseWalletExtension?: unknown;
  }
}

export {};
