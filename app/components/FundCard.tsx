/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { toast } from 'sonner';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { TrendingUp, Trophy, Clock, DollarSign } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

import { useMemo } from 'react';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';

const formatBalance = (balance: bigint): string => {
  const formatted = formatEther(balance);
  // Format to max 4 decimal places and remove trailing zeros
  return parseFloat(formatted).toFixed(4).replace(/\.?0+$/, '');
};

interface FundInfo {
  address: `0x${string}`; // Using fundAddress from subgraph
  name: string;
  manager: `0x${string}`;
  createdAt: number; // Using blockTimestamp
  blockNumber: number;
  fee: number;
}

// Update the streaming summary section with the aggregated data
const StreamingSummary = ({ aggregatedData, streamsCount }: {
  aggregatedData: { totalDailyFlow: string; totalStreamed: string } | null;
  streamsCount: number;
}) => {
  // Convert totalDailyFlow to flowRate (per second)
  const flowRatePerSecond = useMemo(() => {
    if (!aggregatedData?.totalDailyFlow) return BigInt(0);
    return BigInt(Math.floor(Number(aggregatedData.totalDailyFlow) * 1e18 / 86400));
  }, [aggregatedData?.totalDailyFlow]);

  // Get the starting balance and date
  const startingBalance = useMemo(() => 
    aggregatedData?.totalStreamed ? 
    BigInt(Math.floor(Number(aggregatedData.totalStreamed) * 1e18)) : 
    BigInt(0)
  , [aggregatedData?.totalStreamed]);

  const startDate = useMemo(() => new Date(), []);

  // Use the flowing balance hook for animation
  const flowingBalance = useFlowingBalance(
    startingBalance,
    startDate,
    flowRatePerSecond
  );

  // Format the flowing balance for display
  const displayBalance = formatBalance(flowingBalance);

  return (
    <div className="flex-1 mb-4 bg-fluid-primary/5 rounded-xl p-3 backdrop-blur-sm 
                   border border-fluid-primary/20">
      <div className="flex justify-between items-center mb-3">
        <div className="text-fluid-primary font-medium text-sm">Total Investment</div>
        <div className="text-xs bg-fluid-primary/10 px-2.5 py-1 rounded-full text-fluid-primary">
          {streamsCount} active {streamsCount === 1 ? 'stream' : 'streams'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col items-center py-4">
          <div className="text-2xl font-bold text-fluid-primary">
            {displayBalance} USDCx
          </div>
          <div className="text-sm text-white/60">Total Streamed</div>
        </div>

        {/* Daily Flow Rate */}
        <div className="flex justify-between items-center pt-3 border-t border-fluid-primary/10">
          <div className="text-sm text-white/60">Daily Flow</div>
          <div className="text-sm font-medium text-fluid-primary">
            {aggregatedData?.totalDailyFlow || '0'} USDCx/day
          </div>
        </div>
      </div>
    </div>
  );
};

const FundCard = ({ fund }: { fund: FundInfo }) => {
  const { 
    activeStreams, 
    loading: streamsLoading, 
    error: streamsError, 
    createStream, 
    deleteStream,
    aggregatedStreamData 
  } = useSuperfluid(fund.address);
  const { address: walletAddress } = useAccount();

  // Format the creation date
  const createdDate = new Date(fund.createdAt * 1000).toLocaleDateString();

  // Compute the performance metric as (totalDailyFlow / totalStreamed) * 100
  const performanceMetric = useMemo(() => {
    if (
      aggregatedStreamData &&
      aggregatedStreamData.totalStreamed &&
      Number(aggregatedStreamData.totalStreamed) !== 0
    ) {
      const perf =
        (Number(aggregatedStreamData.totalDailyFlow) /
          Number(aggregatedStreamData.totalStreamed)) *
        100;
      return perf.toFixed(2);
    }
    return "0.00";
  }, [aggregatedStreamData]);

  // Define defaultPnl based on performanceMetric for the Current PNL card
  const defaultPnl = useMemo(() => {
    const percentage = parseFloat(performanceMetric);
    return {
      isPositive: percentage >= 0,
      percentage,
      value: 0, // Placeholder value; adjust if needed.
    };
  }, [performanceMetric]);

  const handleCreateStream = async (monthlyAmount: string) => {
    try {
      const hash = await createStream(fund.address, monthlyAmount);
      toast.success('Stream created successfully!', { id: 'stream-create' });
    } catch (err) {
      toast.error('Failed to create stream: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    try {
      const stream = activeStreams.find(s => s.id === streamId);
      if (stream) {
        const hash = await deleteStream(stream.receiver as `0x${string}`);
        toast.success('Stream deleted successfully!', { id: 'stream-delete' });
      }
    } catch (err) {
      toast.error('Failed to delete stream: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Calculate total flow rate and earliest stream date
  const totalFlowRate = useMemo(() => {
    if (!activeStreams.length) return BigInt(0);
    return activeStreams.reduce((sum, stream) => sum + BigInt(stream.flowRate), BigInt(0));
  }, [activeStreams]);

  const earliestStreamDate = useMemo(() => {
    if (!activeStreams.length) return new Date();
    return activeStreams.reduce((earliest, stream) => {
      const streamDate = new Date(Number(stream.updatedAtTimestamp) * 1000);
      return streamDate < earliest ? streamDate : earliest;
    }, new Date());
  }, [activeStreams]);

  // Use flowing balance hook
  const flowingBalance = useFlowingBalance(
    BigInt(0),
    earliestStreamDate,
    totalFlowRate
  );

  // Calculate total daily flow from unique streams
  const totalDailyFlow = useMemo(() => {
    if (!activeStreams.length) return "0.00";
    
    // Use Map to store unique streams by receiver
    const uniqueStreams = new Map();
    activeStreams.forEach(stream => {
      if (!uniqueStreams.has(stream.receiver)) {
        uniqueStreams.set(stream.receiver, stream);
      }
    });

    // Calculate total daily flow from unique streams
    return Array.from(uniqueStreams.values())
      .reduce((total, stream) => {
        return total + (Number(stream.flowRate) / 10 ** stream.token.decimals * 86400);
      }, 0)
      .toFixed(2);
  }, [activeStreams]);

  // Calculate total streamed amount
  const totalStreamed = useMemo(() => {
    if (!flowingBalance) return "0.00";
    return formatBalance(flowingBalance);
  }, [flowingBalance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/95 to-gray-900 
                border border-white/[0.08] hover:border-fluid-primary/30 
                transition-all duration-300 shadow-xl hover:shadow-fluid-primary/20 min-h-[600px] w-full"
    >
      <div className="p-6 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fluid-primary to-fluid-primary/60 
                          flex items-center justify-center shadow-lg shadow-fluid-primary/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-xl font-bold text-white group-hover:text-fluid-primary transition-colors">
                {fund.name}
              </h3>
              <div className="flex items-center text-white/60 text-sm gap-2">
                <span>Pro Trader</span>
              </div>
            </div>
          </div>

          {/* Updated Performance Badge */}
          <div className="flex items-center gap-2 bg-gray-500/10 text-gray-400 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-gray-500/20 self-start">
            Performance: +{performanceMetric}%
          </div>
        </div>

        {/* Metrics Grid - Maintaining structure with placeholders */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/[0.03] rounded-xl p-5 backdrop-blur-sm border border-white/[0.05]
                        hover:border-fluid-primary/20 transition-colors group/card">
            <div className="flex items-center text-white/70 mb-3">
              Current PNL
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <span className={`${defaultPnl.isPositive ? "text-green-400" : "text-red-400"} flex items-center gap-1`}>
                  {defaultPnl.isPositive ? "+" : "-"}{defaultPnl.percentage.toFixed(2)}%
                </span>
              </div>
              <div className="text-sm text-white/60 mt-1">
              since inception
            </div>
            </div>
          </div>
          
          <div className="bg-white/[0.03] rounded-xl p-5 backdrop-blur-sm border border-white/[0.05]
                        hover:border-fluid-primary/20 transition-colors group/card">
            <div className="flex items-center text-white/70 mb-3">
              Fund Fee
            </div>
            <div className="text-2xl font-bold text-white">
              {fund.fee ? `${fund.fee.toFixed(2)}%` : 'N/A'}
            </div>
            <div className="text-sm text-white/60 mt-2">
              of total profits
            </div>
          </div>
        </div>

        {/* Replace the existing streams section with the new summary */}
        {streamsLoading ? (
          <div className="flex-1 mb-4 bg-fluid-primary/5 rounded-xl p-3 backdrop-blur-sm 
                       border border-fluid-primary/20">
            <LoadingSpinner />
          </div>
        ) : streamsError ? (
          <div className="flex-1 mb-4 bg-fluid-primary/5 rounded-xl p-3 backdrop-blur-sm 
                       border border-fluid-primary/20 text-red-400">
            {streamsError}
          </div>
        ) : (
          <StreamingSummary 
            aggregatedData={aggregatedStreamData}
            streamsCount={activeStreams.length}
          />
        )}

        {/* Actions Section */}
        <div className="mt-auto space-y-2">
          <Link
            href={`/fund/${fund.address}`}
            className="block w-full py-2.5 rounded-xl border border-fluid-primary/30 
                     text-center text-fluid-primary font-medium hover:bg-fluid-primary/10 
                     transition-all duration-300"
          >
            View Detailed Analytics
          </Link>
        </div>

        {/* Subscription Timer */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60 
                   bg-white/[0.02] rounded-full px-4 py-2 border border-white/[0.05]"
        >
          <Clock className="w-4 h-4 text-fluid-primary" />
          Subscription Status: N/A
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FundCard;