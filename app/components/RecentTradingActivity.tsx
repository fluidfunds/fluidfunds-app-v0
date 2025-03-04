// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ExternalLink, LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import { AVAILABLE_TOKENS } from '../types/trading';

interface Trade {
  id: string;
  amountIn: number;
  amountOut: number;
  tokenIn: string;
  tokenOut: string;
  timestamp: Date;
  transactionHash: string;
}

interface RecentTradingActivityProps {
  trades: Trade[];
  loading: boolean;
}

const getTokenSymbol = (address: string): string => {
  const lowerAddress = address.toLowerCase();
  
  // Find matching token from AVAILABLE_TOKENS
  const token = AVAILABLE_TOKENS.find(
    token => token.address.toLowerCase() === lowerAddress
  );

  if (token) {
    return token.symbol;
  }

  // Fallback: return shortened address if token not found
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Add a number formatting helper function
const formatAmount = (amount: number) => {
  // Check if amount is very small (less than 0.0001)
  if (amount < 0.0001) {
    return amount.toExponential(4);
  }
  // For larger numbers, show up to 6 decimal places
  return amount.toLocaleString('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2
  });
};

export const RecentTradingActivity = ({ trades, loading }: RecentTradingActivityProps) => {
  // Sort trades by timestamp in descending order (newest first)
  const sortedTrades = [...trades].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Get only the first 5 trades (most recent)
  const recentTrades = sortedTrades.slice(0, 5);
  
  console.log('All trades:', trades);
  console.log('Sorted and filtered trades:', recentTrades);

  const formatTime = (timestamp: Date) => {
    // Ensure we're working with a proper Date object
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    
    // More granular time differences
    if (diffInSeconds < 30) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  };

  return (
    <div className="bg-white/[0.02] rounded-xl backdrop-blur-sm border border-white/[0.08] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Trading Activity</h3>
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <LineChart className="w-4 h-4" />
          <span>Last {Math.min(trades.length, 5)} of {trades.length} trades</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fluid-primary"></div>
        </div>
      ) : recentTrades.length > 0 ? (
        <div className="divide-y divide-white/[0.08] space-y-4">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {formatAmount(trade.amountIn)} {getTokenSymbol(trade.tokenIn)}
                      </span>
                      <span className="text-white/60 px-1">→</span>
                      <span className="text-white font-medium">
                        {formatAmount(trade.amountOut)} {getTokenSymbol(trade.tokenOut)}
                      </span>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-white/[0.05] text-xs text-white/60">
                      {formatTime(trade.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">
                      {trade.transactionHash.slice(0, 6)}...{trade.transactionHash.slice(-4)}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${trade.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-white/60">
          <LineChart className="w-12 h-12 mb-3 opacity-40" />
          <p>No trades executed yet</p>
        </div>
      )}
    </div>
  );
};