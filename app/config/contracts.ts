export const FLUID_FUNDS_ADDRESS = '0x65a20115346c3b39CF455c56B8c433fD31A592D4'

export const FLUID_FUNDS_ABI = [
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "_acceptedToken", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  { inputs: [], name: "ArrayLengthMismatch", type: "error" },
  { inputs: [], name: "FundDurationTooShort", type: "error" },
  { inputs: [], name: "InvalidAcceptedToken", type: "error" },
  { inputs: [], name: "InvalidSubscriptionEndTime", type: "error" },
  { inputs: [], name: "InvalidToken", type: "error" },
  { inputs: [], name: "ProfitSharingPercentageTooHigh", type: "error" },
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
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "status",
        type: "bool"
      }
    ],
    name: "TokenWhitelisted",
    type: "event"
  },
  {
    inputs: [],
    name: "acceptedToken",
    outputs: [{ internalType: "contract ISuperToken", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "allFunds",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "profitSharingPercentage", type: "uint256" },
      { internalType: "uint256", name: "subscriptionEndTime", type: "uint256" },
      { internalType: "uint256", name: "fundDuration", type: "uint256" }
    ],
    name: "createFund",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isFund",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "isTokenWhitelisted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "bool", name: "status", type: "bool" }
    ],
    name: "setTokenWhitelisted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "whitelistedTokens",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const

// Superfluid contract addresses on Base Sepolia
export const SUPERFLUID_ADDRESSES = {
  host: '0x4C073B3baB6d8536C9735e15896c2aB22eB2F847',
  cfa: '0x0F3B163623F05b2BfF4AC2Bd9F466Bc47515E5E5',
  usdcx: '0x1650581F573eAd727B92073B5Ef8B4f5B94D1648'
} as const

export const CFA_FORWARDER_ADDRESS = '0xcfA132E353cB4E398080B9700609bb008eceB125'