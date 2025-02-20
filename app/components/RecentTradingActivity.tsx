import { useMemo } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArrowUpRight, ArrowDownRight, CircleDollarSign, LineChart } from 'lucide-react';

interface Trade {
  id: string;
  type: 'LONG' | 'SHORT';
  pair: string;
  amount: number;
  profit: number;
  timestamp: number;
  status: 'OPEN' | 'CLOSED';
}

const generateMockTrades = (): Trade[] => {
  const pairs = ['ETH/USDC', 'BTC/USDC', 'LINK/USDC', 'MATIC/USDC'];
  const trades: Trade[] = [];
  
  for (let i = 0; i < 10; i++) {
    const isProfit = Math.random() > 0.3;
    trades.push({
      id: `trade-${i}`,
      type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
      pair: pairs[Math.floor(Math.random() * pairs.length)],
      amount: Math.floor(Math.random() * 50000) + 10000,
      profit: isProfit ? (Math.random() * 8 + 1) : -(Math.random() * 5 + 1),
      timestamp: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
      status: Math.random() > 0.3 ? 'CLOSED' : 'OPEN'
    });
  }
  
  return trades.sort((a, b) => b.timestamp - a.timestamp);
};

export const RecentTradingActivity = () => {
  const trades = useMemo(() => generateMockTrades(), []);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="flex items-center justify-between py-4 border-b border-white/[0.08] group hover:bg-white/[0.02] px-4 -mx-4 transition-colors rounded-lg"
        >
          {/* Left side - Trade info */}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center
              ${trade.type === 'LONG' 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'}`}
            >
              {trade.type === 'LONG' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{trade.pair}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full
                  ${trade.type === 'LONG' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'}`}
                >
                  {trade.type}
                </span>
                {trade.status === 'OPEN' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                    OPEN
                  </span>
                )}
              </div>
              <p className="text-sm text-white/60">{formatTimeAgo(trade.timestamp)}</p>
            </div>
          </div>

          {/* Right side - Profit/Loss */}
          <div className="text-right">
            <p className={`font-medium flex items-center gap-1 justify-end
              ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              <CircleDollarSign className="w-4 h-4" />
              {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}%
            </p>
            <p className="text-sm text-white/60">
              ${trade.amount.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};