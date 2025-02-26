export interface Token {
    address: `0x${string}`;  // Ethereum address
    symbol: string;          // Token symbol (e.g., "USDC")
    name: string;            // Token name (e.g., "USD Coin")
    decimals: number;        // Token decimals (usually 18 for most tokens, 6 for USDC)
    logoURI?: string;        // Optional logo URL
  }