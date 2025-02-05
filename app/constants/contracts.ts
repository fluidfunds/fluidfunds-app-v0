export const FLUID_FLOW_FACTORY_ABI = [
  // Event for fund creation
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "fundAddress", type: "address" },
      { indexed: true, name: "manager", type: "address" },
      { name: "name", type: "string" }
    ],
    name: "FundCreated",
    type: "event"
  }
] as const

export const FLUID_FLOW_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "profitSharingPercentage",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "subscriptionEndTime",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "minInvestmentAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const

// Verify contract address is correct
export const FLUID_FUNDS_ADDRESS = '0x436b0da27ca80da91f661ff591a9381ea7056567' 