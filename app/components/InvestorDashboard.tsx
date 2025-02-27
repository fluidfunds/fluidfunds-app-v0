import { useMemo, memo } from 'react';
import { useInvestorStreams } from '@/app/hooks/useInvestorStreams';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { ArrowDownUp, WalletCards, Info, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper function to format balance with appropriate decimal places
const formatBalance = (balance: bigint): string => {
  const formatted = formatEther(balance);
  // Format to max 4 decimal places and remove trailing zeros
  return parseFloat(formatted).toFixed(4).replace(/\.?0+$/, '');
};

interface InvestorDashboardProps {
  fundAddress: `0x${string}`;
}

// Create a separate StreamAnimation component - memoized
const StreamAnimation = memo(() => (
  <motion.div
    className="absolute inset-0 w-full bg-gradient-to-r from-fluid-primary via-fluid-primary/70 to-transparent"
    animate={{
      x: ["0%", "100%"],
      opacity: [1, 0.5, 1]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }}
  />
));
StreamAnimation.displayName = 'StreamAnimation';

// Create a separate StreamCard component - memoized
const StreamCard = memo(({ displayBalance, dailyFlowRate }: { displayBalance: string, dailyFlowRate: string }) => (
  <div className="bg-gradient-to-br from-fluid-primary/10 to-transparent rounded-xl p-4 backdrop-blur-sm 
               border border-fluid-primary/20 flex items-center hover:shadow-fluid-primary/10 transition-all duration-200">
    <div className="bg-fluid-primary/20 p-2 rounded-full mr-4 hidden sm:block">
      <ArrowDownUp className="w-4 h-4 text-fluid-primary" />
    </div>
    
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/90 font-medium text-sm sm:text-base">Active Stream</span>
        <div className="text-sm text-white/70 flex items-center">
          <TrendingUp className="w-3.5 h-3.5 mr-1 text-fluid-primary" />
          <span className="bg-fluid-primary/20 text-fluid-primary text-xs px-2 py-0.5 rounded-md">
            {dailyFlowRate} USDCx/day
          </span>
        </div>
      </div>
      
      <div className="text-2xl font-bold text-white">
        {displayBalance} <span className="text-fluid-primary text-lg">USDCx</span>
      </div>
      
      <div className="text-xs text-white/60">Total Investment Streamed</div>
      
      {/* Animated Stream Indicator with separated animation component */}
      <div className="relative h-1.5 bg-fluid-primary/10 rounded-full overflow-hidden mt-3">
        <StreamAnimation />
      </div>
    </div>
  </div>
));
StreamCard.displayName = 'StreamCard';

// Create a separate FundTokensCard component - memoized
const FundTokensCard = memo(() => (
  <div className="bg-gradient-to-br from-slate-800/50 to-transparent rounded-xl p-4 backdrop-blur-sm 
               border border-white/10 flex items-center">
    <div className="bg-white/10 p-2 rounded-full mr-4 hidden sm:block">
      <WalletCards className="w-4 h-4 text-white/70" />
    </div>
    
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/90 font-medium text-sm sm:text-base">Fund Tokens</span>
        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
          Coming Soon
        </span>
      </div>
      
      <div className="text-2xl font-bold text-white/50">
        - - -
      </div>
      
      <div className="text-xs text-white/40">Fund Token Balance</div>
      
      {/* Progress Bar - static, no animation */}
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
        <div className="absolute inset-0 w-0 bg-white/20 rounded-full" />
      </div>
    </div>
  </div>
));
FundTokensCard.displayName = 'FundTokensCard';

// Main component - now using memo
const InvestorDashboard = memo(({ fundAddress }: InvestorDashboardProps) => {
  const { 
    stream, 
    loading, 
    error, 
    dailyFlowRate
  } = useInvestorStreams(fundAddress);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { address: walletAddress } = useAccount();

  // Use flowing balance hook to show real-time streaming - optimize with stable references
  const startDate = useMemo(() => 
    stream ? new Date(Number(stream.updatedAtTimestamp || '0') * 1000) : new Date()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [stream?.updatedAtTimestamp]); // More specific dependency

  const startingBalance = useMemo(() => 
    stream?.streamedUntilUpdatedAt ? BigInt(stream.streamedUntilUpdatedAt) : BigInt(0)
  , [stream?.streamedUntilUpdatedAt]); // More specific dependency

  const flowRate = useMemo(() => 
    stream?.flowRate ? BigInt(stream.flowRate) : BigInt(0)
  , [stream?.flowRate]); // More specific dependency

  // Get the flowing balance with a slower update interval
  const flowingBalance = useFlowingBalance(
    startingBalance,
    startDate,
    flowRate, // Update once per second instead of every frame
  );

  // Format the flowing balance for display
  const displayBalance = useMemo(() => 
    formatBalance(flowingBalance)
  , [flowingBalance]);
  
  // Format timestamps for display
  const formattedStartDate = useMemo(() => {
    if (!stream?.updatedAtTimestamp) return '';
    const date = new Date(Number(stream.updatedAtTimestamp) * 1000);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }, [stream?.updatedAtTimestamp]);

  // Memoize the rendered content to prevent unnecessary re-renders
  const renderContent = useMemo(() => {
    // Loading state
    if (loading) {
      return (
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/60 rounded-xl p-6 backdrop-blur-md border border-white/10">
          <div className="flex justify-center items-center py-4">
            <svg className="animate-spin h-5 w-5 text-fluid-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-white/70">Loading investment data...</span>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="bg-gradient-to-br from-red-900/20 to-slate-900/60 rounded-xl p-5 backdrop-blur-md border border-red-500/20">
          <div className="text-red-400 text-center py-2 flex items-center justify-center">
            <Activity className="h-4 w-4 text-red-400 mr-2" />
            <p>Error loading investment data: {error}</p>
          </div>
        </div>
      );
    }

    // No stream state
    if (!stream || flowRate === BigInt(0)) {
      return (
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/60 rounded-xl p-5 backdrop-blur-md border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500/10 p-1.5 rounded-full">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h3 className="font-medium text-white">Investment Status</h3>
            </div>
            
            <div className="text-white/70 flex items-center">
              <p>Not currently investing</p>
              <button className="ml-3 bg-fluid-primary/20 hover:bg-fluid-primary/30 text-fluid-primary text-xs font-medium px-3 py-1 rounded-lg transition duration-200">
                Start Streaming
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Active stream state
    return (
      <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/60 rounded-xl p-5 backdrop-blur-md border border-fluid-primary/10 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-fluid-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Header with activity label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-2 text-fluid-primary" />
            <h3 className="font-medium text-white text-sm">My Investments</h3>
          </div>
          <div className="text-xs bg-fluid-primary/20 px-2 py-1 rounded-full text-fluid-primary">
            Active since {formattedStartDate}
          </div>
        </div>
        
        {/* Vertical stack of horizontal cards */}
        <div className="flex flex-col space-y-3">
          {/* Use separated components with memoized props */}
          <StreamCard displayBalance={displayBalance} dailyFlowRate={dailyFlowRate} />
          <FundTokensCard />
        </div>
      </div>
    );
  }, [loading, error, stream, flowRate, formattedStartDate, displayBalance, dailyFlowRate]);

  return renderContent;
});

InvestorDashboard.displayName = 'InvestorDashboard';

export default InvestorDashboard;