export const FLUID_FUNDS_ADDRESS = '0x436b0da27ca80da91f661ff591a9381ea7056567'

export const FLUID_FUNDS_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_host', type: 'address' },
      { internalType: 'address', name: '_cfa', type: 'address' },
      { internalType: 'address', name: '_usdcx', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "fundAddress",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "manager",
        type: "address"
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string"
      }
    ],
    name: "FundCreated",
    type: "event"
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'allFunds',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address[]', name: 'tokens', type: 'address[]' },
      { internalType: 'bool[]', name: 'statuses', type: 'bool[]' }
    ],
    name: 'batchSetTokenWhitelisted',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'cfa',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string'
      },
      {
        internalType: 'uint256',
        name: 'profitSharingPercentage',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'subscriptionEndTime',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'minInvestmentAmount',
        type: 'uint256'
      }
    ],
    name: 'createFund',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'host',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'bool', name: 'status', type: 'bool' }
    ],
    name: 'setTokenWhitelisted',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'usdcx',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: "isFund",
    inputs: [{ type: "address", name: "" }],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "isTokenWhitelisted",
    inputs: [{ type: "address", name: "token" }],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "whitelistedTokens",
    inputs: [{ type: "address", name: "" }],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: 'getWhitelistedTokens',
    outputs: [{ type: 'address[]', name: '' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'fund', type: 'address' }],
    name: 'getFundMetadataUri',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    "inputs": [],
    "name": "getFundsCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "funds",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Superfluid contract addresses on Base Sepolia
export const SUPERFLUID_ADDRESSES = {
  host: '0x4C073B3baB6d8536C9735e15896c2aB22eB2F847',
  cfa: '0x0F3B163623F05b2BfF4AC2Bd9F466Bc47515E5E5',
  usdcx: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
} as const 