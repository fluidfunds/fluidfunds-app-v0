import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { parseEther, type Address } from 'viem';
import { useWriteContract } from 'wagmi';
import { SUPERFLUID_FLOW_ABI, FLUID_FUNDS_SUBGRAPH_URL } from '@/app/config/contracts';

const USDCX_ADDRESS = '0xe72f289584eDA2bE69Cfe487f4638F09bAc920Db' as const;
const DAIX_ADDRESS = '0x9Ce2062b085A2268E8d769fFC040f6692315fd2c' as const;
const LTC_ADDRESS = '0xB2f89CabbaF106D0cA10302D10A6d4b1734d5009' as const;
const ETH_ADDRESS = '0xC0341325A034516C4146ef496A768De1850d09f5' as const;
const BTC_ADDRESS = '0xbEc5068ace31Df3b6342450689d030716FdDA961' as const;
const AAVE_ADDRESS = '0x8CAA1B86c6aa7B4c8B733515ad1A9a2Ecf8A9887' as const;
const DOGE_ADDRESS = '0xD3443DdcE8a43626fA54f0a3aeE81451D4e1a6b3' as const;

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
  poolFee: number;
}

export const useTrading = (fundAddress: Address) => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [swaps, setSwaps] = useState<SwapExecuted[]>([]);
  const [isLoadingSwaps, setIsLoadingSwaps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, isPending } = useWriteContract();

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

  // Calculate latest balances from swap history
  const getLatestBalance = (tokenAddress: string): bigint => {
    if (!swaps.length) return 0n;
    
    const latestSwap = swaps[0];
    const lowerTokenAddress = tokenAddress.toLowerCase();
    
    if (latestSwap.tokenIn.toLowerCase() === lowerTokenAddress) {
      return BigInt(latestSwap.amountIn);
    } 
    if (latestSwap.tokenOut.toLowerCase() === lowerTokenAddress) {
      return BigInt(latestSwap.amountOut);
    }
    
    return 0n;
  };

  const swap = async ({
    tokenIn,
    tokenOut,
    amountIn,
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
        functionName: 'executeTrade', // Adjust this if your FluidFunds contract uses a different name
        args: [
          tokenInAddress,         // tokenIn address
          tokenOutAddress,        // tokenOut address
          amountIn,
          0n,                     // minAmountOut: 0 for testnet
          3000                    // poolFee: 3000 (0.3%) as number
        ]
      } as const;

      console.log('Executing trade with params:', {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: BigInt(amountIn),
        minAmountOut: '0',
        poolFee: '3000',
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
    isLoading: isSwapping || isPending || isLoadingSwaps,
    USDCxBalance: getLatestBalance(USDCX_ADDRESS),
    DAIxBalance: getLatestBalance(DAIX_ADDRESS),
    LTCBalance: getLatestBalance(LTC_ADDRESS),
    ETHBalance: getLatestBalance(ETH_ADDRESS),
    BTCBalance: getLatestBalance(BTC_ADDRESS),
    AAVEBalance: getLatestBalance(AAVE_ADDRESS),
    DOGEBalance: getLatestBalance(DOGE_ADDRESS),
    USDCX_ADDRESS,
    DAIX_ADDRESS,
    LTC_ADDRESS,
    ETH_ADDRESS,
    BTC_ADDRESS,
    AAVE_ADDRESS,
    DOGE_ADDRESS,
    swaps,
    error,
  };
};