// /app/config/contracts.ts

// FluidFunds contract address on Sepolia
export const FLUID_FUNDS_ADDRESS = '0x42d678925115915Fe4b2e1C1b13f7Dd2B00a25de' as const;

// Subgraph URL for FluidFunds on Sepolia
export const FLUID_FUNDS_SUBGRAPH_URL =
  'https://api.studio.thegraph.com/query/104988/fluidfunds/version/latest' as const;

// FluidFunds ABI (typed as const for TypeScript inference with wagmi/viem)
export const FLUID_FUNDS_ABI = [
  {
    inputs: [
      { internalType: 'contract ISuperfluid', name: '_host', type: 'address' },
      { internalType: 'address', name: '_tradeExec', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'ArrayLengthMismatch', type: 'error' },
  { inputs: [], name: 'InvalidAcceptedToken', type: 'error' },
  { inputs: [], name: 'InvalidToken', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'fundAddress', type: 'address' },
      { indexed: true, internalType: 'address', name: 'manager', type: 'address' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'startTime', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'duration', type: 'uint256' },
    ],
    name: 'FundCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [],
    name: 'acceptedToken',
    outputs: [{ internalType: 'contract ISuperToken', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'profitSharingPercentage', type: 'uint256' },
      { internalType: 'uint256', name: 'subscriptionEndTime', type: 'uint256' },
      { internalType: 'uint256', name: 'fundDuration', type: 'uint256' },
      { internalType: 'contract ISuperToken', name: '_acceptedToken', type: 'address' },
    ],
    name: 'createFund',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tradeExec',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Superfluid Flow contract address on Sepolia
export const SUPERFLUID_FLOW_ADDRESS = '0xe4b40daed6a70985107f7d67dc6f6637d770a647' as const;

// Superfluid Flow ABI (typed as const for TypeScript inference with wagmi/viem)
export const SUPERFLUID_FLOW_ABI = [
  {
    inputs: [{ internalType: 'contract ISuperfluid', name: '_host', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'FundDurationTooShort', type: 'error' },
  { inputs: [], name: 'FundStillActive', type: 'error' },
  { inputs: [], name: 'NotAcceptedSuperToken', type: 'error' },
  { inputs: [], name: 'NotImplemented', type: 'error' },
  { inputs: [], name: 'OnlyFundManager', type: 'error' },
  { inputs: [], name: 'OnlyOwner', type: 'error' },
  { inputs: [], name: 'SubscriptionPeriodEnded', type: 'error' },
  { inputs: [], name: 'UnauthorizedHost', type: 'error' },
  {
    anonymous: false,
    inputs: [],
    name: 'FundClosed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'contract ISuperToken',
        name: '_acceptedToken',
        type: 'address',
      },
      { indexed: false, internalType: 'address', name: '_fundManager', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_fundDuration', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_subscriptionDuration', type: 'uint256' },
      { indexed: false, internalType: 'address', name: '_factory', type: 'address' },
      { indexed: false, internalType: 'string', name: '_fundTokenName', type: 'string' },
      { indexed: false, internalType: 'string', name: '_fundTokenSymbol', type: 'string' },
    ],
    name: 'FundFlow',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'positionId', type: 'uint256' }],
    name: 'PositionClosed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'tokenIn', type: 'address' },
      { indexed: true, internalType: 'address', name: 'tokenOut', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amountOut', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'isOpen', type: 'bool' },
    ],
    name: 'TradeExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'tokenBalance', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amountTaken', type: 'uint256' },
    ],
    name: 'UserLiquidated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'fundTokensRedeemed', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amountReceived', type: 'uint256' },
    ],
    name: 'UserWithdrawn',
    type: 'event',
  },
  {
    inputs: [],
    name: 'CFAV1_TYPE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'HOST',
    outputs: [{ internalType: 'contract ISuperfluid', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'acceptedToken',
    outputs: [{ internalType: 'contract ISuperToken', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ISuperToken', name: 'superToken', type: 'address' },
      { internalType: 'address', name: 'agreementClass', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes', name: 'agreementData', type: 'bytes' },
      { internalType: 'bytes', name: '', type: 'bytes' },
      { internalType: 'bytes', name: 'ctx', type: 'bytes' },
    ],
    name: 'afterAgreementCreated',
    outputs: [{ internalType: 'bytes', name: 'newCtx', type: 'bytes' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ISuperToken', name: 'superToken', type: 'address' },
      { internalType: 'address', name: 'agreementClass', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes', name: 'agreementData', type: 'bytes' },
      { internalType: 'bytes', name: 'cbdata', type: 'bytes' },
      { internalType: 'bytes', name: 'ctx', type: 'bytes' },
    ],
    name: 'afterAgreementTerminated',
    outputs: [{ internalType: 'bytes', name: 'newCtx', type: 'bytes' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ISuperToken', name: 'superToken', type: 'address' },
      { internalType: 'address', name: 'agreementClass', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes', name: 'agreementData', type: 'bytes' },
      { internalType: 'bytes', name: 'cbdata', type: 'bytes' },
      { internalType: 'bytes', name: 'ctx', type: 'bytes' },
    ],
    name: 'afterAgreementUpdated',
    outputs: [{ internalType: 'bytes', name: 'newCtx', type: 'bytes' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ISuperToken', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes', name: '', type: 'bytes' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'beforeAgreementCreated',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ISuperToken', name: 'superToken', type: 'address' },
      { internalType: 'address', name: 'agreementClass', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes', name: 'agreementData', type: 'bytes' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'beforeAgreementTerminated',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ISuperToken', name: 'superToken', type: 'address' },
      { internalType: 'address', name: 'agreementClass', type: 'address' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes', name: 'agreementData', type: 'bytes' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'beforeAgreementUpdated',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'closeFund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'createFundFlow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'tokenIn', type: 'address' },
      { internalType: 'address', name: 'tokenOut', type: 'address' },
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'minAmountOut', type: 'uint256' },
      { internalType: 'uint24', name: 'poolFee', type: 'uint24' },
    ],
    name: 'executeTrade',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fundEndTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fundManager',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fundToken',
    outputs: [{ internalType: 'contract ISuperToken', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bool', name: 'activateOnCreated', type: 'bool' },
      { internalType: 'bool', name: 'activateOnUpdated', type: 'bool' },
      { internalType: 'bool', name: 'activateOnDeleted', type: 'bool' },
    ],
    name: 'getConfigWord',
    outputs: [{ internalType: 'uint256', name: 'configWord', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'host',
    outputs: [{ internalType: 'contract ISuperfluid', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ISuperToken', name: '_acceptedToken', type: 'address' },
      { internalType: 'address', name: '_fundManager', type: 'address' },
      { internalType: 'uint256', name: '_fundDuration', type: 'uint256' },
      { internalType: 'uint256', name: '_subscriptionDuration', type: 'uint256' },
      { internalType: 'address', name: '_factory', type: 'address' },
      { internalType: 'string', name: '_fundTokenName', type: 'string' },
      { internalType: 'string', name: '_fundTokenSymbol', type: 'string' },
      { internalType: 'address', name: '_tradeExec', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'contract ISuperToken', name: 'superToken', type: 'address' }],
    name: 'isAcceptedSuperToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isFundActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bool', name: 'activateOnCreated', type: 'bool' },
      { internalType: 'bool', name: 'activateOnUpdated', type: 'bool' },
      { internalType: 'bool', name: 'activateOnDeleted', type: 'bool' },
    ],
    name: 'selfRegister',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'subscriptionDeadline',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStreamed',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tradeExecutor',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Trade Executor ABI
export const TRADE_EXECUTOR_ABI = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'poolFee', type: 'uint24' },
    ],
    name: 'executeTrade', // Fixed function name
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Also add the Trade Executor contract address
export const TRADE_EXECUTOR_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;
