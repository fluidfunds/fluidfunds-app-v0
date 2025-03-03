import { useEffect, useState } from 'react';
import { useTradeHistory } from './useTradeHistory';

export interface TokenAveragePrice {
  tokenAddress: string;
  symbol: string;
  avgPurchasePrice: number;
  totalBought: number;
  totalSpent: number;
}

export function useTokenAveragePrices(fundAddress: `0x${string}`) {
  const { trades, loading, error } = useTradeHistory(fundAddress);
  const [averagePrices, setAveragePrices] = useState<Record<string, TokenAveragePrice>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!trades.length || loading) return;
    
    setIsCalculating(true);
    
    try {
      const tokenPurchases: Record<string, { totalSpent: number; totalBought: number; symbol: string }> = {};
      
      // Process each trade to calculate average prices
      trades.forEach(trade => {
        // We only care about tokens being bought (tokenOut)
        const tokenAddress = trade.tokenOut.toLowerCase();
        const tokenSymbol = getTokenSymbol(trade.tokenOut); // Implement this helper from your RecentTradingActivity
        
        if (!tokenPurchases[tokenAddress]) {
          tokenPurchases[tokenAddress] = {
            totalSpent: 0,
            totalBought: 0,
            symbol: tokenSymbol
          };
        }
        
        // Add the amounts from this trade
        tokenPurchases[tokenAddress].totalSpent += trade.amountIn;
        tokenPurchases[tokenAddress].totalBought += trade.amountOut;
      });
      
      // Calculate average price for each token
      const calculatedPrices: Record<string, TokenAveragePrice> = {};
      
      Object.entries(tokenPurchases).forEach(([tokenAddress, data]) => {
        if (data.totalBought > 0) {
          calculatedPrices[tokenAddress] = {
            tokenAddress,
            symbol: data.symbol,
            avgPurchasePrice: data.totalSpent / data.totalBought,
            totalBought: data.totalBought,
            totalSpent: data.totalSpent
          };
        }
      });
      
      setAveragePrices(calculatedPrices);
    } catch (err) {
      console.error('Error calculating average prices:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [trades, loading]);

  return { averagePrices, loading: loading || isCalculating, error };
}

// Helper function to get token symbol
function getTokenSymbol(address: string) {
  const lowerAddress = address.toLowerCase();
  if (lowerAddress.includes('920d')) return 'USDCx';
  if (lowerAddress.includes('5fd2')) return 'DAIx';
  return address.slice(-5, -1);
}