import { logger } from './logger';

const COVALENT_API_KEY = process.env.NEXT_PUBLIC_COVALENT_API_KEY;
const COVALENT_BASE_URL = 'https://api.covalenthq.com/v1';

// Define interfaces for Covalent API responses
export interface TokenBalance {
  contract_decimals: number;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  supports_erc?: string[];
  logo_url: string;
  last_transferred_at: string;
  native_token: boolean;
  type: string;
  balance: string;
  balance_24h: string;
  quote_rate: number;
  quote_rate_24h: number;
  quote: number;
  quote_24h: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nft_data?: any;
}

export interface CovalentResponse {
  address: string;
  updated_at: string;
  next_update_at: string;
  quote_currency: string;
  chain_id: number;
  chain_name: string;
  items: TokenBalance[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagination: any;
  error: boolean;
  error_message: string | null;
  error_code: number | null;
}

export interface HistoricalPortfolioResponse {
  address: string;
  updated_at: string;
  next_update_at: string;
  quote_currency: string;
  chain_id: number;
  items: {
    contract_decimals: number;
    contract_name: string;
    contract_ticker_symbol: string;
    contract_address: string;
    holdings: {
      timestamp: string;
      quote_rate: number;
      close: {
        balance: string;
        quote: number;
      };
    }[];
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagination: any;
  error: boolean;
  error_message: string | null;
  error_code: number | null;
}

/**
 * Get token balances for a specific address
 * @param address Wallet or contract address
 * @param chainId Chain ID (default: eth-sepolia)
 * @returns Array of token balances
 */
export async function getFundBalances(
  address: string,
  chainId: string = 'eth-sepolia'
): Promise<TokenBalance[]> {
  const apiKey = process.env.NEXT_PUBLIC_COVALENT_API_KEY;

  if (!apiKey) {
    console.error('❌ Missing Covalent API key in environment variables');
    throw new Error('Missing Covalent API key');
  }

  if (apiKey === 'your_covalent_api_key_here') {
    console.error('❌ Using placeholder API key. Please replace with your actual Covalent API key');
    throw new Error('Invalid Covalent API key');
  }

  try {
    console.log(`🔍 Fetching balances for ${address} on chain ${chainId}`);

    // Construct the API URL
    const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/`;
    console.log(`📡 API Request URL: ${url}`);

    // Make the API request with proper auth
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Covalent API error (${response.status}): ${errorText}`);
      throw new Error(`Covalent API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Received response from Covalent API`);

    // Check for API-level errors
    if (data.error) {
      console.error(`❌ Covalent API returned error: ${data.error_message}`);
      throw new Error(`Covalent API error: ${data.error_message}`);
    }

    // Return the token balances
    return data.data.items as TokenBalance[];
  } catch (error) {
    console.error('❌ Error fetching token balances:', error);
    throw error;
  }
}

/**
 * Get historical portfolio value for a specific address
 * @param address Wallet or contract address
 * @param chainId Chain ID (default: eth-sepolia)
 * @param days Number of days of history to fetch (default: 30)
 * @returns Historical portfolio data
 */
export async function getPortfolioHistory(
  address: string,
  chainId: string = 'eth-sepolia',
  days: number = 30
): Promise<HistoricalPortfolioResponse> {
  const apiKey = process.env.NEXT_PUBLIC_COVALENT_API_KEY;

  if (!apiKey) {
    console.error('❌ Missing Covalent API key in environment variables');
    throw new Error('Missing Covalent API key');
  }

  if (apiKey === 'your_covalent_api_key_here') {
    console.error('❌ Using placeholder API key. Please replace with your actual Covalent API key');
    throw new Error('Invalid Covalent API key');
  }

  try {
    console.log(
      `🔍 Fetching portfolio history for ${address} on chain ${chainId} for ${days} days`
    );

    // Construct the API URL
    const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/portfolio_v2/`;
    console.log(`📡 API Request URL: ${url}`);

    // Make the API request with proper auth
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Covalent API error (${response.status}): ${errorText}`);
      throw new Error(`Covalent API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Received portfolio history from Covalent API`);

    // Check for API-level errors
    if (data.error) {
      console.error(`❌ Covalent API returned error: ${data.error_message}`);
      throw new Error(`Covalent API error: ${data.error_message}`);
    }

    // Return the portfolio history data
    return data.data as HistoricalPortfolioResponse;
  } catch (error) {
    console.error('❌ Error fetching portfolio history:', error);
    throw error;
  }
}

/**
 * Get token transfers for a specific address
 * @param address Wallet or contract address
 * @param chainId Chain ID (default: eth-sepolia)
 * @returns Token transfers data
 */
export async function getTokenTransfers(
  address: string,
  chainId: string = 'eth-sepolia'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const apiKey = process.env.NEXT_PUBLIC_COVALENT_API_KEY;

  if (!apiKey) {
    console.error('❌ Missing Covalent API key in environment variables');
    throw new Error('Missing Covalent API key');
  }

  if (apiKey === 'your_covalent_api_key_here') {
    console.error('❌ Using placeholder API key. Please replace with your actual Covalent API key');
    throw new Error('Invalid Covalent API key');
  }

  try {
    console.log(`🔍 Fetching token transfers for ${address} on chain ${chainId}`);

    // Construct the API URL
    const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/transfers_v2/`;
    console.log(`📡 API Request URL: ${url}`);

    // Make the API request with proper auth
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Covalent API error (${response.status}): ${errorText}`);
      throw new Error(`Covalent API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Received token transfers from Covalent API`);

    // Check for API-level errors
    if (data.error) {
      console.error(`❌ Covalent API returned error: ${data.error_message}`);
      throw new Error(`Covalent API error: ${data.error_message}`);
    }

    // Return the token transfers data
    return data.data;
  } catch (error) {
    console.error('❌ Error fetching token transfers:', error);
    throw error;
  }
}

export interface Transaction {
  block_signed_at: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  log_events: LogEvent[];
}

interface LogEvent {
  decoded: {
    name: string;
    params: {
      name: string;
      type: string;
      value: string;
    }[];
  };
  sender_address: string;
  sender_name: string;
}

export async function getFundTransactions(address: string) {
  try {
    const response = await fetch(
      `${COVALENT_BASE_URL}/137/address/${address}/transactions_v3/?key=${COVALENT_API_KEY}&page-size=100`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data.data.items as Transaction[];
  } catch (error) {
    logger.error('Error fetching fund transactions:', error);
    throw error;
  }
}

// Token address mappings for Polygon
export const TOKEN_ADDRESSES = {
  USDCx: '0xe72f289584eDA2bE69Cfe487f4638F09bAc920Db',
  DAIx: '0x9Ce2062b085A2268E8d769fFC040f6692315fd2c',
} as const;

// Reverse mapping for looking up symbols
export const ADDRESS_TO_SYMBOL = Object.entries(TOKEN_ADDRESSES).reduce(
  (acc, [symbol, address]) => ({
    ...acc,
    [address.toLowerCase()]: symbol,
  }),
  {} as { [key: string]: string }
);

export function getTokenSymbol(address: string): string {
  return ADDRESS_TO_SYMBOL[address.toLowerCase()] || address;
}

export function isSwapEvent(logEvent: LogEvent): boolean {
  return logEvent.decoded?.name === 'TokensSwapped' || logEvent.decoded?.name === 'TokenExchange';
}

export function parseSwapDetails(logEvent: LogEvent): {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
} | null {
  try {
    const params = logEvent.decoded.params;

    // Find relevant parameters
    const tokenIn = params.find(p => p.name.includes('tokenIn'))?.value;
    const tokenOut = params.find(p => p.name.includes('tokenOut'))?.value;
    const amountIn = params.find(p => p.name.includes('amountIn'))?.value;
    const amountOut = params.find(p => p.name.includes('amountOut'))?.value;

    if (!tokenIn || !tokenOut || !amountIn || !amountOut) {
      return null;
    }

    return {
      tokenIn: getTokenSymbol(tokenIn),
      tokenOut: getTokenSymbol(tokenOut),
      amountIn,
      amountOut,
    };
  } catch (error) {
    logger.error('Error parsing swap details:', error);
    return null;
  }
}
