import { ethers } from 'ethers';
import { getSigner, getProvider } from './web3';

// Contract addresses - these will be updated after deployment
export const CONTRACT_ADDRESSES = {
  Lock: process.env.NEXT_PUBLIC_LOCK_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

// Lock contract ABI - copied from Hardhat artifacts
export const LOCK_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_unlockTime",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "when",
        "type": "uint256"
      }
    ],
    "name": "Withdrawal",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unlockTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Get Lock contract instance with signer
export const getLockContract = async (): Promise<ethers.Contract | null> => {
  if (!CONTRACT_ADDRESSES.Lock) {
    console.error('Lock contract address not set');
    return null;
  }

  console.log('Using Lock contract address:', CONTRACT_ADDRESSES.Lock);

  const signer = await getSigner();
  if (!signer) {
    console.error('No signer available');
    return null;
  }

  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.Lock, LOCK_ABI, signer);
    
    // Verify the contract exists by checking if it has code
    const provider = await signer.provider;
    const code = await provider?.getCode(CONTRACT_ADDRESSES.Lock);
    if (!code || code === '0x') {
      console.error('No contract code found at address:', CONTRACT_ADDRESSES.Lock);
      console.error('Make sure the contract is deployed and you are connected to the correct network');
      return null;
    }
    
    return contract;
  } catch (error) {
    console.error('Error creating contract instance:', error);
    return null;
  }
};

// Get Lock contract instance with provider (read-only)
export const getLockContractReadOnly = async (): Promise<ethers.Contract | null> => {
  if (!CONTRACT_ADDRESSES.Lock) {
    console.error('Lock contract address not set');
    return null;
  }

  console.log('Using Lock contract address (read-only):', CONTRACT_ADDRESSES.Lock);

  const provider = getProvider();
  if (!provider) {
    console.error('No provider available');
    return null;
  }

  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.Lock, LOCK_ABI, provider);
    
    // Verify the contract exists by checking if it has code
    const code = await provider.getCode(CONTRACT_ADDRESSES.Lock);
    if (!code || code === '0x') {
      console.error('No contract code found at address:', CONTRACT_ADDRESSES.Lock);
      console.error('Make sure the contract is deployed and you are connected to the correct network');
      return null;
    }
    
    return contract;
  } catch (error) {
    console.error('Error creating read-only contract instance:', error);
    return null;
  }
};

// Lock contract methods
export class LockContract {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // Read methods
  async getUnlockTime(): Promise<bigint> {
    return await this.contract.unlockTime();
  }

  async getOwner(): Promise<string> {
    try {
      console.log('Calling owner() on contract:', await this.contract.getAddress());
      const owner = await this.contract.owner();
      console.log('Contract owner:', owner);
      return owner;
    } catch (error) {
      console.error('Error calling owner():', error);
      console.error('Contract address:', await this.contract.getAddress());
      throw error;
    }
  }

  async getBalance(): Promise<bigint> {
    const provider = getProvider();
    if (!provider) throw new Error('No provider available');
    
    return await provider.getBalance(await this.contract.getAddress());
  }

  // Write methods
  async withdraw(): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.withdraw();
  }

  // Event listeners
  onWithdrawal(callback: (amount: bigint, when: bigint) => void): void {
    this.contract.on('Withdrawal', callback);
  }

  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }
}

// Create LockContract instance
export const createLockContract = async (): Promise<LockContract | null> => {
  const contract = await getLockContract();
  if (!contract) return null;
  
  return new LockContract(contract);
};

// Create read-only LockContract instance
export const createLockContractReadOnly = async (): Promise<LockContract | null> => {
  const contract = await getLockContractReadOnly();
  if (!contract) return null;
  
  return new LockContract(contract);
};