import { Address } from 'viem';

export interface Token {
  symbol: string;
  address: Address;
}

export const AVAILABLE_TOKENS = [
  { 
    symbol: 'fUSDCx', 
    address: '0xe72f289584eDA2bE69Cfe487f4638F09bAc920Db' as Address 
  },
  { 
    symbol: 'fDAIx', 
    address: '0x9Ce2062b085A2268E8d769fFC040f6692315fd2c' as Address 
  }
] as const;