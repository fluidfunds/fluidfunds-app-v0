import { useMemo, memo } from 'react';
import { useInvestorStreams } from '@/app/hooks/useInvestorStreams';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { ArrowDownUp, Info, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper function to format balance with appropriate decimal places
const formatBalance = (balance: bigint): string => {
  const formatted = formatEther(balance);
  // Format to max 4 decimal places and remove trailing zeros
  return parseFloat(formatted)
    .toFixed(4)
    .replace(/\.?0+$/, '');
};

interface InvestorDashboardProps {
  fundAddress: `0x${string}`;
}

// Create a separate StreamAnimation component - memoized
const StreamAnimation = memo(() => (
  <motion.div
    className="absolute inset-0 w-full bg-gradient-to-r from-fluid-primary via-fluid-primary/70 to-transparent"
    animate={{
      x: ['0%', '100%'],
      opacity: [1, 0.5, 1],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
));
StreamAnimation.displayName = 'StreamAnimation';

// Create a separate StreamCard component - memoized
const StreamCard = memo(
  ({ displayBalance, dailyFlowRate }: { displayBalance: string; dailyFlowRate: string }) => (
    <div className="flex items-center rounded-xl border border-fluid-primary/20 bg-gradient-to-br from-fluid-primary/10 to-transparent p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-fluid-primary/10">
      <div className="mr-4 hidden rounded-full bg-fluid-primary/20 p-2 sm:block">
        <ArrowDownUp className="h-4 w-4 text-fluid-primary" />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-white/90 sm:text-base">Active Stream</span>
          <div className="flex items-center text-sm text-white/70">
            <TrendingUp className="mr-1 h-3.5 w-3.5 text-fluid-primary" />
            <span className="rounded-md bg-fluid-primary/20 px-2 py-0.5 text-xs text-fluid-primary">
              {dailyFlowRate} USDCx/day
            </span>
          </div>
        </div>

        <div className="text-2xl font-bold text-white">
          {displayBalance} <span className="text-lg text-fluid-primary">USDCx</span>
        </div>

        <div className="text-xs text-white/60">Total Investment Streamed</div>

        {/* Animated Stream Indicator with separated animation component */}
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-fluid-primary/10">
          <StreamAnimation />
        </div>
      </div>
    </div>
  )
);
StreamCard.displayName = 'StreamCard';

// Create a separate FundTokensCard component - memoized
const FundTokensCard = memo(
  ({ displayBalance, dailyFlowRate }: { displayBalance: string; dailyFlowRate: string }) => (
    <div className="flex items-center rounded-xl border border-fluid-primary/20 bg-gradient-to-br from-fluid-primary/10 to-transparent p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-fluid-primary/10">
      <div className="mr-4 hidden rounded-full bg-fluid-primary/20 p-2 sm:block">
        <ArrowDownUp className="h-4 w-4 text-fluid-primary" />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-white/90 sm:text-base">Active Stream</span>
          <div className="flex items-center text-sm text-white/70">
            <TrendingUp className="mr-1 h-3.5 w-3.5 text-fluid-primary" />
            <span className="rounded-md bg-fluid-primary/20 px-2 py-0.5 text-xs text-fluid-primary">
              {dailyFlowRate} TCPx/day
            </span>
          </div>
        </div>

        <div className="text-2xl font-bold text-white">
          {displayBalance} <span className="text-lg text-fluid-primary">TCPx</span>
        </div>

        <div className="text-xs text-white/60">Total TCPx received</div>

        {/* Animated Stream Indicator with separated animation component */}
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-fluid-primary/10">
          <StreamAnimation />
        </div>
      </div>
    </div>
  )
);
FundTokensCard.displayName = 'FundTokensCard';

// Main component - now using memo
const InvestorDashboard = memo(({ fundAddress }: InvestorDashboardProps) => {
  const { stream, loading, error, dailyFlowRate } = useInvestorStreams(fundAddress);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { address: walletAddress } = useAccount();

  // Use flowing balance hook to show real-time streaming - optimize with stable references
  const startDate = useMemo(
    () => (stream ? new Date(Number(stream.updatedAtTimestamp || '0') * 1000) : new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stream?.updatedAtTimestamp]
  ); // More specific dependency

  const startingBalance = useMemo(
    () => (stream?.streamedUntilUpdatedAt ? BigInt(stream.streamedUntilUpdatedAt) : BigInt(0)),
    [stream?.streamedUntilUpdatedAt]
  ); // More specific dependency

  const flowRate = useMemo(
    () => (stream?.flowRate ? BigInt(stream.flowRate) : BigInt(0)),
    [stream?.flowRate]
  ); // More specific dependency

  // Get the flowing balance with a slower update interval
  const flowingBalance = useFlowingBalance(
    startingBalance,
    startDate,
    flowRate // Update once per second instead of every frame
  );

  // Format the flowing balance for display
  const displayBalance = useMemo(() => formatBalance(flowingBalance), [flowingBalance]);

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
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/30 to-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-center py-4">
            <svg
              className="h-5 w-5 animate-spin text-fluid-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="ml-3 text-white/70">Loading investment data...</span>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-900/20 to-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-center py-2 text-center text-red-400">
            <Activity className="mr-2 h-4 w-4 text-red-400" />
            <p>Error loading investment data: {error}</p>
          </div>
        </div>
      );
    }

    // No stream state
    if (!stream || flowRate === BigInt(0)) {
      return (
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800/30 to-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-indigo-500/10 p-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <h3 className="font-medium text-white">Investment Status</h3>
            </div>

            <div className="flex items-center text-white/70">
              <p>Not currently investing</p>
              <button className="ml-3 rounded-lg bg-fluid-primary/20 px-3 py-1 text-xs font-medium text-fluid-primary transition duration-200 hover:bg-fluid-primary/30">
                Start Streaming
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Active stream state
    return (
      <div className="relative overflow-hidden rounded-xl border border-fluid-primary/10 bg-gradient-to-br from-slate-800/30 to-slate-900/60 p-5 backdrop-blur-md">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-fluid-primary/5 blur-3xl"></div>

        {/* Header with activity label */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="mr-2 h-4 w-4 text-fluid-primary" />
            <h3 className="text-sm font-medium text-white">My Investments</h3>
          </div>
          <div className="rounded-full bg-fluid-primary/20 px-2 py-1 text-xs text-fluid-primary">
            Active since {formattedStartDate}
          </div>
        </div>

        {/* Vertical stack of horizontal cards */}
        <div className="flex flex-col space-y-3">
          {/* Use separated components with memoized props */}
          <StreamCard displayBalance={displayBalance} dailyFlowRate={dailyFlowRate} />
          <FundTokensCard displayBalance={displayBalance} dailyFlowRate={dailyFlowRate} />
        </div>
      </div>
    );
  }, [loading, error, stream, flowRate, formattedStartDate, displayBalance, dailyFlowRate]);

  return renderContent;
});

InvestorDashboard.displayName = 'InvestorDashboard';

export default InvestorDashboard;
