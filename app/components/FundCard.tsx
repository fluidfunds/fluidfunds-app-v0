"use client";
import { memo, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';
import { formatEther } from 'viem';
import { TrendingUp, Trophy, Clock, DollarSign } from 'lucide-react';
import { logger } from '@/app/utils/logger';

interface FundInfo {
  address: `0x${string}`;
  verified?: boolean;
  metadataUri?: string;
  name: string;
  description?: string;
  image?: string;
  manager: `0x${string}`;
  strategy?: string;
  socialLinks?: { twitter?: string; discord?: string; telegram?: string };
  performanceMetrics?: { tvl: string; returns: string; investors: number };
  updatedAt?: number;
  blockNumber: number;
  createdAt: number;
  profitSharingPercentage: number;
  subscriptionEndTime: number;
  minInvestmentAmount: bigint;
  formattedDate: string;
  profitSharingFormatted: string;
  minInvestmentFormatted: string;
  pnl?: {
    percentage: number;
    value: number;
    isPositive: boolean;
  };
}

interface FundCardProps {
  fund: FundInfo;
}

const ANIMATION_MINIMUM_STEP_TIME = 100;

const absoluteValue = (n: bigint) => (n >= BigInt(0) ? n : -n);

const toFixedUsingString = (numStr: string, decimalPlaces: number): string => {
  const [wholePart, decimalPart] = numStr.split('.');
  if (!decimalPart || decimalPart.length <= decimalPlaces) {
    return numStr.padEnd(wholePart.length + 1 + decimalPlaces, '0');
  }
  const decimalPartBigInt = BigInt(`${decimalPart.slice(0, decimalPlaces)}${decimalPart[decimalPlaces] >= '5' ? '1' : '0'}`);
  return `${wholePart}.${decimalPartBigInt.toString().padStart(decimalPlaces, '0')}`;
};

const useSignificantFlowingDecimal = (flowRate: bigint, animationStepTimeInMs: number): number | undefined =>
  useMemo(() => {
    if (flowRate === BigInt(0)) return undefined;

    const ticksPerSecond = 1000 / animationStepTimeInMs;
    const flowRatePerTick = flowRate / BigInt(ticksPerSecond);
    const formatted = formatEther(flowRatePerTick);
    const [beforeEtherDecimal, afterEtherDecimal] = formatted.split('.');

    const isFlowingInWholeNumbers = absoluteValue(BigInt(beforeEtherDecimal)) > BigInt(0);
    if (isFlowingInWholeNumbers) return 0;

    const numberAfterDecimalWithoutLeadingZeroes = BigInt(afterEtherDecimal || '0');
    const lengthToFirstSignificantDecimal = afterEtherDecimal
      ?.toString()
      .replace(numberAfterDecimalWithoutLeadingZeroes.toString(), '').length || 0;

    return Math.min(lengthToFirstSignificantDecimal + 2, 18);
  }, [flowRate, animationStepTimeInMs]);

const FundCard = memo(({ fund }: FundCardProps) => {
  const { activeStreams, loading, error } = useSuperfluid(fund.address);

  const subscriptionEndDate = new Date(fund.subscriptionEndTime * 1000).toLocaleDateString();
  const isSubscriptionOpen = fund.subscriptionEndTime > Date.now() / 1000;

  const defaultPnl = { percentage: 0, value: 0, isPositive: true };
  const pnl = fund.pnl ?? defaultPnl;

  const { totalFlowRate, earliestStartDate } = useMemo(() => {
    if (!activeStreams.length) {
      return { totalFlowRate: BigInt(0), earliestStartDate: new Date() };
    }
    const total = activeStreams.reduce((sum, stream) => sum + BigInt(stream.flowRate), BigInt(0));
    const earliest = activeStreams.reduce((earliest, stream) => {
      const streamDate = new Date(Number(stream.updatedAtTimestamp) * 1000);
      return streamDate < earliest ? streamDate : earliest;
    }, new Date(Number(activeStreams[0].updatedAtTimestamp) * 1000));
    return { totalFlowRate: total, earliestStartDate: earliest };
  }, [activeStreams]);

  const totalStreamBalance = useFlowingBalance(BigInt(0), earliestStartDate, totalFlowRate);
  const decimalPlaces = useSignificantFlowingDecimal(totalFlowRate, ANIMATION_MINIMUM_STEP_TIME);

  const formatValue = (value: bigint) => {
    const formattedEther = formatEther(value);
    const formatted = decimalPlaces !== undefined
      ? toFixedUsingString(formattedEther, decimalPlaces)
      : formattedEther;
    return `${formatted} USDCx`;
  };

  const totalDailyFlow = useMemo(() => {
    const dailyFlow = Number(totalFlowRate) / 10 ** 18 * 86400;
    return dailyFlow.toFixed(2);
  }, [totalFlowRate]);

  if (loading) {
    logger.log('Loading streams for fund:', { address: fund.address, name: fund.name, timestamp: Date.now() });
  } else if (error) {
    logger.error('Error loading streams for fund:', { address: fund.address, name: fund.name, error, timestamp: Date.now() });
  } else {
    logger.log('FundCard stream data:', {
      fundAddress: fund.address,
      fundName: fund.name,
      activeStreamsCount: activeStreams.length,
      totalFlowRate: totalFlowRate.toString(),
      totalStreamBalance: totalStreamBalance.toString(),
      timestamp: Date.now(),
    });
  }

  console.log('FundCard rendered:', { 
    fundAddress: fund.address, 
    activeStreamsLength: activeStreams.length, 
    totalStreamBalance: totalStreamBalance.toString(), 
    loading, 
    error, 
    timestamp: Date.now() 
  });

  const handleLinkClick = () => {
    logger.log('Link clicked:', { fundAddress: fund.address, timestamp: Date.now() });
  };

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
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>Since {new Date(fund.createdAt * 1000).getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-green-500/10 text-green-400 
                       px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm 
                       border border-green-500/20 self-start">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            +24.5% Past Month
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/[0.03] rounded-xl p-5 backdrop-blur-sm border border-white/[0.05] hover:border-fluid-primary/20 transition-colors group/card">
            <div className="flex items-center text-white/70 mb-3">
              <TrendingUp className="w-5 h-5 mr-2 text-fluid-primary group-hover/card:scale-110 transition-transform" />
              Current PNL
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <span className={`${pnl.isPositive ? "text-green-400" : "text-red-400"} flex items-center gap-1`}>
                  {pnl.isPositive ? "+" : "-"}{pnl.percentage.toFixed(2)}%
                  <span className="text-sm font-normal">30d</span>
                </span>
              </div>
              <div className="text-sm text-white/60 mt-1">
                {pnl.isPositive ? "+" : "-"}${Math.abs(pnl.value).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="bg-white/[0.03] rounded-xl p-5 backdrop-blur-sm border border-white/[0.05] hover:border-fluid-primary/20 transition-colors group/card">
            <div className="flex items-center text-white/70 mb-3">
              <DollarSign className="w-5 h-5 mr-2 text-fluid-primary group-hover/card:scale-110 transition-transform" />
              Profit Share
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-white">
                {fund.profitSharingFormatted}
              </div>
              <div className="text-sm text-white/60 mt-1">
                of total profits
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 mb-4 flex items-center justify-center">
            <div className="text-fluid-primary">Loading streams...</div>
          </div>
        ) : error ? (
          <div className="flex-1 mb-4 bg-fluid-primary/5 rounded-2xl p-5 backdrop-blur-sm border border-fluid-primary/20">
            <div className="text-red-400 font-medium">Error: {error}</div>
          </div>
        ) : (
          <div className="flex-1 mb-4 bg-fluid-primary/5 rounded-xl p-3 backdrop-blur-sm border border-fluid-primary/20">
            <div className="flex justify-between items-center mb-3">
              <div className="text-fluid-primary font-medium text-sm">Total Investment</div>
              <div className="text-xs bg-fluid-primary/10 px-2.5 py-1 rounded-full text-fluid-primary">
                {activeStreams.length} active {activeStreams.length === 1 ? 'stream' : 'streams'}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-white/60">Total</div>
              <span className="text-lg font-bold text-fluid-primary">
                {formatValue(totalStreamBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-white/60">Per Day</div>
              <span className="text-sm font-medium text-fluid-primary">
                {totalDailyFlow} USDCx/day
              </span>
            </div>
            <div className="relative h-0.5 bg-fluid-primary/5 rounded-full overflow-hidden mt-3">
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-fluid-primary/30 to-fluid-primary/50"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto space-y-2">
          <Link
            href={`/fund/${fund.address}`}
            onClick={handleLinkClick}
            className="block w-full py-2.5 rounded-xl border border-fluid-primary/30 
                     text-center text-fluid-primary font-medium hover:bg-fluid-primary/10 
                     transition-all duration-300"
          >
            View Detailed Analytics
          </Link>
        </div>

        {isSubscriptionOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60 
                     bg-white/[0.02] rounded-full px-4 py-2 border border-white/[0.05]"
          >
            <Clock className="w-4 h-4 text-fluid-primary" />
            Investment Window Closes: {subscriptionEndDate}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => prevProps.fund.address === nextProps.fund.address);

FundCard.displayName = 'FundCard';
export default FundCard;