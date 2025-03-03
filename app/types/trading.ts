import { Address } from 'viem';

export interface Token {
  decimals: number;
  symbol: string;
  address: Address;
}

export const AVAILABLE_TOKENS = [
  {
    symbol: 'fUSDC',
    address: '0xe72f289584eDA2bE69Cfe487f4638F09bAc920Db' as Address,
    decimals: 18
  },
  {
    symbol: 'fDAI',
    address: '0x9Ce2062b085A2268E8d769fFC040f6692315fd2c' as Address,
    decimals: 18
  },
  {
    symbol: 'LTC',
    address: '0xB2f89CabbaF106D0cA10302D10A6d4b1734d5009' as Address,
    decimals: 8
  },
  {
    symbol: 'ETH',
    address: '0xC0341325A034516C4146ef496A768De1850d09f5' as Address,
    decimals: 18
  },
  {
    symbol: 'BTC',
    address: '0xbEc5068ace31Df3b6342450689d030716FdDA961' as Address,
    decimals: 8
  },
  {
    symbol: 'AAVE',
    address: '0x8CAA1B86c6aa7B4c8B733515ad1A9a2Ecf8A9887' as Address,
    decimals: 18
  },
  {
    symbol: 'DOGE',
    address: '0xD3443DdcE8a43626fA54f0a3aeE81451D4e1a6b3' as Address,
    decimals: 8
  }
] as const;