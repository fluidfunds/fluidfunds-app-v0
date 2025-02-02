import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { mainnet } from 'viem/chains'

// Public client for reading from the blockchain
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

// Function to create wallet client when user connects
export const createWallet = () => {
  if (!window.ethereum) throw new Error('No MetaMask found')
  
  return createWalletClient({
    chain: mainnet,
    transport: custom(window.ethereum)
  })
}

// Define more specific types for ethereum provider
interface RequestArguments {
  method: string;
  params?: Array<string | number | boolean | object>;
}

type ProviderMessage = {
  type: string;
  data: unknown;
};

interface ProviderEventCallback {
  (message: ProviderMessage): void;
}

type ProviderRequest = {
  eth_requestAccounts: never[];
  eth_accounts: never[];
  eth_chainId: never[];
  // Add other specific ethereum methods as needed
};

interface EthereumProvider {
  request: <T extends keyof ProviderRequest>(args: { 
    method: T; 
    params?: ProviderRequest[T];
  }) => Promise<string[]>;
  isMetaMask?: boolean;
  on?: (event: string, callback: ProviderEventCallback) => void;
  removeListener?: (event: string, callback: ProviderEventCallback) => void;
}

// Update window ethereum type declaration
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Connect wallet and get address
export const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Please install MetaMask to connect your wallet')
  }

  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    })
    
    return {
      address: accounts[0]
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to connect wallet')
  }
} 