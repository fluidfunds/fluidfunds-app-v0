import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { parseEther, type Address } from 'viem';
import { useWriteContract } from 'wagmi';
import { SUPERFLUID_FLOW_ABI, FLUID_FUNDS_SUBGRAPH_URL } from '@/app/config/contracts';

// Export these addresses so they can be accessed from components that use this hook
export const USDC_ADDRESS = '0xe72f289584eDA2bE69Cfe487f4638F09bAc920Db' as const;
export const USDCx_ADDRESS = '0xb598E6C621618a9f63788816ffb50Ee2862D443B' as const;
export const DAI_ADDRESS = '0x9Ce2062b085A2268E8d769fFC040f6692315fd2c' as const;
export const LTC_ADDRESS = '0xB2f89CabbaF106D0cA10302D10A6d4b1734d5009' as const;
export const ETH_ADDRESS = '0xC0341325A034516C4146ef496A768De1850d09f5' as const;
export const BTC_ADDRESS = '0xbEc5068ace31Df3b6342450689d030716FdDA961' as const;
export const AAVE_ADDRESS = '0x8CAA1B86c6aa7B4c8B733515ad1A9a2Ecf8A9887' as const;
export const DOGE_ADDRESS = '0xD3443DdcE8a43626fA54f0a3aeE81451D4e1a6b3' as const;

interface SwapExecuted {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  trader: string;
  blockTimestamp: string;
  blockNumber: string;
  transactionHash: string;
}

interface SwapParams {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  poolFee?: number;
}

export const useTrading = (fundAddress: Address) => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [swaps, setSwaps] = useState<SwapExecuted[]>([]);
  const [isLoadingSwaps, setIsLoadingSwaps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, bigint>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const { writeContract, isPending } = useWriteContract();

  // Fetch token balances using RPC
  useEffect(() => {
    if (!fundAddress) return;

    const fetchTokenBalances = async () => {
      setIsLoadingBalances(true);
      try {
        // Create an array of token addresses to check
        const tokenAddresses = [
          USDC_ADDRESS, 
          USDCx_ADDRESS, // Add Super Token
          DAI_ADDRESS,
          LTC_ADDRESS,
          ETH_ADDRESS,
          BTC_ADDRESS,
          AAVE_ADDRESS,
          DOGE_ADDRESS
        ];

        // This would be replaced with actual RPC calls to get balances
        // For example:
        const balances = await Promise.all(
          tokenAddresses.map(async (address) => {
            try {
              const response = await fetch(`/api/token-balance?tokenAddress=${address}&account=${fundAddress}`);
              if (!response.ok) throw new Error('Failed to fetch balance');
              const data = await response.json();
              return { address, balance: BigInt(data.balance) };
            } catch (err) {
              console.error(`Error fetching balance for ${address}:`, err);
              return { address, balance: 0n };
            }
          })
        );

        // Update balances state
        const balanceMap: Record<string, bigint> = {};
        balances.forEach(({ address, balance }) => {
          balanceMap[address.toLowerCase()] = balance;
        });
        
        setTokenBalances(balanceMap);
      } catch (err) {
        console.error('Error fetching token balances:', err);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchTokenBalances();
    const interval = setInterval(fetchTokenBalances, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fundAddress]);

  // Fetch swaps from subgraph
  useEffect(() => {
    if (!fundAddress) return;

    const fetchSwaps = async () => {
      setIsLoadingSwaps(true);
      try {
        const query = `
          query GetFundSwaps($fundAddress: Bytes!) {
            swapExecuteds(
              where: { trader: $fundAddress }
              orderBy: blockTimestamp
              orderDirection: desc
              first: 10
            ) {
              id
              tokenIn
              tokenOut
              amountIn
              amountOut
              trader
              blockTimestamp
              blockNumber
              transactionHash
            }
          }
        `;

        const response = await fetch(FLUID_FUNDS_SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { fundAddress: fundAddress.toLowerCase() },
          }),
        });

        if (!response.ok) {
          throw new Error(`Subgraph request failed: ${response.status}`);
        }

        const result = await response.json();
        setSwaps(result.data?.swapExecuteds || []);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch swaps';
        setError(errorMsg);
        console.error('Error fetching swaps:', err);
      } finally {
        setIsLoadingSwaps(false);
      }
    };

    fetchSwaps();
    const interval = setInterval(fetchSwaps, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fundAddress]);

  // Get token balance from state
  const getTokenBalance = (tokenAddress: string): bigint => {
    return tokenBalances[tokenAddress.toLowerCase()] || 0n;
  };

  const combinedUSDCBalance = 
    (tokenBalances[USDC_ADDRESS.toLowerCase()] || 0n) + 
    (tokenBalances[USDCx_ADDRESS.toLowerCase()] || 0n);

  const swap = async ({
    tokenIn,
    tokenOut,
    amountIn,
    poolFee = 3000
  }: SwapParams) => {
    if (!tokenIn || !tokenOut || !amountIn) {
      throw new Error('Missing required parameters for swap');
    }

    setIsSwapping(true);
    try {
      // Convert addresses to correct format
      const tokenInAddress = tokenIn.toLowerCase() as `0x${string}`;
      const tokenOutAddress = tokenOut.toLowerCase() as `0x${string}`;

      const params = {
        abi: SUPERFLUID_FLOW_ABI,
        address: fundAddress,
        functionName: 'executeTrade',
        args: [
          tokenInAddress,         // tokenIn address
          tokenOutAddress,        // tokenOut address
          amountIn,
          0n,                     // minAmountOut: 0 for testnet
          poolFee                 // poolFee: 3000 (0.3%) as default
        ]
      } as const;

      console.log('Executing trade with params:', {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: BigInt(amountIn),
        minAmountOut: '0',
        poolFee: poolFee.toString(),
        fundAddress
      });

      const hash = await writeContract(params);
      return hash;
    } catch (error) {
      console.error('Trade execution failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Trade execution failed');
    } finally {
      setIsSwapping(false);
    }
  };

  return {
    swap,
    isLoading: isSwapping || isPending || isLoadingSwaps || isLoadingBalances,
    // Return actual token balances instead of estimates from swap history
    USDCBalance: combinedUSDCBalance, // Combined balance
    USDCRegularBalance: tokenBalances[USDC_ADDRESS.toLowerCase()] || 0n, // Just fUSDC
    USDCxBalance: tokenBalances[USDCx_ADDRESS.toLowerCase()] || 0n, // Just fUSDCx
    DAIBalance: getTokenBalance(DAI_ADDRESS),
    LTCBalance: getTokenBalance(LTC_ADDRESS),
    ETHBalance: getTokenBalance(ETH_ADDRESS),
    BTCBalance: getTokenBalance(BTC_ADDRESS),
    AAVEBalance: getTokenBalance(AAVE_ADDRESS),
    DOGEBalance: getTokenBalance(DOGE_ADDRESS),
    // Export token addresses
    USDC_ADDRESS,
    DAI_ADDRESS,
    LTC_ADDRESS,
    ETH_ADDRESS,
    BTC_ADDRESS,
    AAVE_ADDRESS,
    DOGE_ADDRESS,
    swaps,
    error,
    // Export token balances map for additional flexibility
    tokenBalances,
    isLoadingBalances,
  };
};