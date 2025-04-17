'use client';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, BarChart2, Activity } from 'lucide-react';
import Link from 'next/link';
import { useFluidFundsSubgraphManager } from '@/app/hooks/useFluidFundsSubgraphManager';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';
import { useMemo } from 'react';
import { formatEther } from 'viem';
import { cn } from '@/app/utils/styles';

// Helper function to format a bigint balance (e.g. to 4 decimal places)
const formatBalance = (balance: bigint): string => {
  const formatted = formatEther(balance);
  return parseFloat(formatted)
    .toFixed(4)
    .replace(/\.?0+$/, '');
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const LeaderBoardStats = () => {
  const stats = [
    {
      name: 'Top Performers',
      value: 100,
      icon: <Trophy className="h-4 w-4 text-amber-400" />,
      iconBackground: 'bg-amber-500/20',
      description: 'Discover the highest performing wallets based on historical returns',
      subDescription: 'and tracked wallet numbers',
    },
    {
      name: 'Active Predictions',
      value: 4,
      icon: <Activity className="h-4 w-4 text-blue-400" />,
      iconBackground: 'bg-blue-500/20',
      description: 'Currently running wallet performance predictions',
      subDescription: 'LIVE predictions status',
    },
    {
      name: 'Total Bets',
      value: 1000000,
      icon: <BarChart2 className="h-4 w-4 text-green-400" />,
      iconBackground: 'bg-green-500/20',
      description: 'Total value locked in prediction markets',
      subDescription: 'value across all predictions',
    },
  ];
  return (
    <div className="mb-8 mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      {stats.map((stat, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          key={stat.name}
          className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10"
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                stat.iconBackground
              )}
            >
              {stat.icon}
            </div>
            <h3 className="font-medium text-white">{stat.name}</h3>
          </div>
          <p className="mb-2 text-2xl font-bold text-white">{formatCurrency(stat.value)}</p>
          <p className="text-sm text-white/70">{stat.description}</p>
          <p className="mt-1 text-xs text-white/50">{stat.subDescription}</p>
        </motion.div>
      ))}
    </div>
  );
};

// Adjusted interface so that metadata and its performanceMetrics are optional.
interface FundWithMetadata {
  address: `0x${string}`;
  // Some funds may not have a full metadata object from the subgraph,
  // so we allow these properties to be optional.
  metadata?: {
    name?: string;
    performanceMetrics?: {
      tvl: string; // Fallback TVL in USDCx
      returns: string; // e.g. performance percentage
      investors: number;
    };
  };
  // If metadata is missing, the fund might have a top‑level name.
  name?: string;
}

export default function LeaderboardPage() {
  // Use the subgraph to get all funds and the count of available funds.
  // Make sure your useFluidFundsSubgraphManager hook returns an object with { funds, loading, error }
  const { funds, loading, error } = useFluidFundsSubgraphManager();

  // Sort funds by fallback TVL (using default "0" if metrics aren't available)
  let sortedFunds = funds.sort((a: FundWithMetadata, b: FundWithMetadata) => {
    const tvlA = parseFloat(a.metadata?.performanceMetrics?.tvl ?? '0');
    const tvlB = parseFloat(b.metadata?.performanceMetrics?.tvl ?? '0');
    return tvlA - tvlB;
  });

  sortedFunds = [...sortedFunds].reverse();
  console.log('sortedFunds: ', sortedFunds);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fluid-bg pb-12 pt-24">
        <p className="text-white">Loading funds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fluid-bg pb-12 pt-24">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fluid-bg pb-12 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-fluid-white-70 transition-colors hover:text-fluid-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold text-fluid-white"
          >
            Fund Rankings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-fluid-white-70"
          >
            Track the performance of all FluidFunds and discover the top performing investment
            opportunities
          </motion.p>
        </div>

        <LeaderBoardStats />

        <div className="mt-12">
          <div className="overflow-hidden rounded-xl bg-fluid-white/5">
            <div className="grid grid-cols-6 gap-4 border-b border-fluid-white/10 p-4 text-sm text-fluid-white-70">
              <div className="col-span-2">Fund Name</div>
              <div className="text-right">Total Investment</div>
              <div className="text-right">Investors</div>
              <div className="text-right">Performance</div>
              <div className="text-right">Rank</div>
            </div>

            {sortedFunds.map((fund: FundWithMetadata, index: number) => (
              <FundRow key={fund.address} fund={fund} rank={index + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FundRowProps {
  fund: FundWithMetadata;
  rank: number;
}

const FundRow = ({ fund, rank }: FundRowProps) => {
  // Get both activeStreams and aggregatedStreamData from the hook
  const { aggregatedStreamData, activeStreams } = useSuperfluid(fund.address);

  // Calculate the per‑second flow rate from the total daily flow if available
  const flowRatePerSecond = useMemo(() => {
    if (!aggregatedStreamData?.totalDailyFlow) return BigInt(0);
    return BigInt(Math.floor((Number(aggregatedStreamData.totalDailyFlow) * 1e18) / 86400));
  }, [aggregatedStreamData?.totalDailyFlow]);

  // Determine the starting balance based on the total streamed amount
  const startingBalance = useMemo(() => {
    return aggregatedStreamData?.totalStreamed
      ? BigInt(Math.floor(Number(aggregatedStreamData.totalStreamed) * 1e18))
      : BigInt(0);
  }, [aggregatedStreamData?.totalStreamed]);

  // Get a flowing (animated) balance using the hook (the start date here is set to now)
  const flowingBalance = useFlowingBalance(startingBalance, new Date(), flowRatePerSecond);
  const displayBalance = formatBalance(flowingBalance);

  // Use the provided fund name or a fallback
  const name =
    fund.metadata?.name ??
    fund.name ??
    `Fund ${fund.address.slice(0, 6)}...${fund.address.slice(-4)}`;

  // Instead of using metadata returns, compute a performance metric
  // For example, we compute the daily yield as (daily flow / total streamed) * 100
  const performanceMetric = useMemo(() => {
    if (
      aggregatedStreamData &&
      aggregatedStreamData.totalStreamed &&
      Number(aggregatedStreamData.totalStreamed) !== 0
    ) {
      const perf =
        (Number(aggregatedStreamData.totalDailyFlow) / Number(aggregatedStreamData.totalStreamed)) *
        100;
      return perf.toFixed(2);
    }
    return '0.00';
  }, [aggregatedStreamData]);

  // Instead of metadata investors, show the number of active streams
  const investorsCount = activeStreams.length;

  return (
    <Link href={`/fund/${fund.address}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1 }}
        className="group grid cursor-pointer grid-cols-6 gap-4 p-4 text-fluid-white transition-colors hover:bg-fluid-white/[0.08]"
      >
        <div className="col-span-2 flex items-center gap-2 font-medium">
          {name}
          <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
        </div>
        <div className="text-right">${displayBalance}</div>
        <div className="text-right">{investorsCount}</div>
        <div className="text-right text-green-400">+{performanceMetric}%</div>
        <div className="text-right font-medium">#{rank}</div>
      </motion.div>
    </Link>
  );
};
