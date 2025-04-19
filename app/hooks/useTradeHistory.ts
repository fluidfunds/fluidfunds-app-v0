import { useEffect, useState } from 'react';
import { FLUID_FUNDS_SUBGRAPH_URL } from '../config/contracts';
import { formatEther } from 'viem';

interface SwapExecuted {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  trader: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface ProcessedTrade {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  timestamp: Date;
  transactionHash: string;
  trader: string;
}

export function useTradeHistory(fundAddress: `0x${string}`) {
  const [trades, setTrades] = useState<ProcessedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const query = `
          query GetSwaps($fundAddress: String!) {
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

        const data = await response.json();

        if (data.errors) {
          throw new Error(data.errors[0].message);
        }

        const processedTrades = data.data.swapExecuteds.map((swap: SwapExecuted) => ({
          id: swap.id,
          tokenIn: swap.tokenIn,
          tokenOut: swap.tokenOut,
          amountIn: Number(formatEther(BigInt(swap.amountIn))),
          amountOut: Number(formatEther(BigInt(swap.amountOut))),
          timestamp: new Date(Number(swap.blockTimestamp) * 1000),
          transactionHash: swap.transactionHash,
          trader: swap.trader,
        }));

        setTrades(processedTrades);
        setError(null);
      } catch (err) {
        console.error('Error fetching trades:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fundAddress]);

  return { trades, loading, error };
}
