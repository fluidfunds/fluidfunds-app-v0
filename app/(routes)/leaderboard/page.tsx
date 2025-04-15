'use client';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFluidFundsSubgraphManager } from '@/app/hooks/useFluidFundsSubgraphManager';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';
import { useMemo } from 'react';
import { formatEther } from 'viem';

// Helper function to format a bigint balance (e.g. to 4 decimal places)
const formatBalance = (balance: bigint): string => {
  const formatted = formatEther(balance);
  return parseFloat(formatted)
    .toFixed(4)
    .replace(/\.?0+$/, '');
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

        <div className="text-center">
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
            className="mx-auto max-w-2xl text-fluid-white-70"
          >
            Track the performance of all FluidFunds and discover the top performing investment
            opportunities
          </motion.p>
        </div>

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

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-fluid-white/5 p-6"
          >
            <Trophy className="mb-4 h-8 w-8 text-yellow-500" />
            <h3 className="mb-2 font-medium text-fluid-white">Top Performers</h3>
            <p className="text-sm text-fluid-white-70">
              Discover the highest performing funds based on historical returns
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-fluid-white/5 p-6"
          >
            <TrendingUp className="mb-4 h-8 w-8 text-green-500" />
            <h3 className="mb-2 font-medium text-fluid-white">Investment Volume</h3>
            <p className="text-sm text-fluid-white-70">
              Track total investments and fund growth over time
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl bg-fluid-white/5 p-6"
          >
            <Users className="mb-4 h-8 w-8 text-blue-500" />
            <h3 className="mb-2 font-medium text-fluid-white">Investor Count</h3>
            <p className="text-sm text-fluid-white-70">
              See which funds are attracting the most investors
            </p>
          </motion.div>
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
