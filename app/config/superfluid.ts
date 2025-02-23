// src/app/config/superfluid.ts
export const SUPERFLUID_ADDRESSES = {
  CFAv1Forwarder: '0xcfA132E353cB4E398080B9700609bb008eceB125',
  USDCx: '0x918E53Db799d7435D2Ef676A4B14c8163ea6D325',
} as const;

export const SUPERFLUID_QUERY_URL = 'https://subgraph-endpoints.superfluid.dev/base-sepolia/protocol-v1';

export const CFAv1ForwarderABI = [
  {
    name: 'createFlow',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'sender', type: 'address' },
      { name: 'receiver', type: 'address' },
      { name: 'flowrate', type: 'int96' },
      { name: 'userData', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'getFlow',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'sender', type: 'address' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [
      { name: 'lastUpdated', type: 'uint256' },
      { name: 'flowrate', type: 'int96' },
      { name: 'deposit', type: 'uint256' },
      { name: 'owedDeposit', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const ERC20ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

export const USDCxABI = [
  {
    type: 'function',
    name: 'realtimeBalanceOf',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      { name: 'availableBalance', type: 'int256', internalType: 'int256' },
      { name: 'deposit', type: 'uint256', internalType: 'uint256' },
      { name: 'owedDeposit', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;