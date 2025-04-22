'use client';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, BarChart2, Activity } from 'lucide-react';
import Link from 'next/link';
import { useFluidFundsSubgraphManager } from '@/app/hooks/useFluidFundsSubgraphManager';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';
import { useEffect, useMemo, useState } from 'react';
import { formatEther } from 'viem';
import { cn } from '@/app/utils/styles';
import { fetchWalletDataForProfile, WalletData } from '@/app/utils/getWalletData';

// Helper function to format a bigint balance (e.g. to 4 decimal places)
const formatBalance = (balance: bigint): string => {
  const formatted = formatEther(balance);
  return parseFloat(formatted).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
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

enum EntityType {
  Fund = 'fund',
  Wallet = 'wallet',
}
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
  type: EntityType.Fund;
}

interface WalletLeaderboardData extends WalletData {
  metadata?: {
    performanceMetrics?: {
      tvl: string;
    };
  };
  type: EntityType.Wallet;
}

export default function LeaderboardPage() {
  // Use the subgraph to get all funds and the count of available funds.
  // Make sure your useFluidFundsSubgraphManager hook returns an object with { funds, loading, error }
  const { funds, loading, error } = useFluidFundsSubgraphManager();
  const [trackedWallets, setTrackedWallets] = useState<WalletLeaderboardData[]>([]);

  // Move trackedWalletsData into useMemo
  const trackedWalletsData = useMemo(
    () => [
      { socialName: 'basefreakz', addresses: ['0xcde9f00116bffe9852b2cd4295446ae5fc51ad0a'] },
      {
        socialName: 'brycekrispy.eth',
        addresses: [
          '0x8ce92c44b81d6b7366a66f25bbf078bfd78829d2',
          '0xcdb53d17f1b829030b4fe0e3e106c2d4db33ac2a',
        ],
      },
      {
        socialName: 'bleu.eth',
        addresses: [
          '0xc4239467a62edaad4a098235a6754579e6662566',
          '0x38a0d87bdeac77ac859ac910a588cf80a05d854d',
          '0xe9dadd9ded105d67e6cb7aadc48be0c2d45df652',
        ],
      },
      {
        socialName: 'maretus',
        addresses: [
          '0x59140f80e6146d3e23a3f44c3c47c9164e4b4a98',
          '0x2225349cdf7f16156d7e4fd5eef774fef180cec1',
          '0xd9c0e850a086aa5febd40f2668c5d7e15d7d74a2',
          '0xcb69c793478a7355178979ae0be453bf61c378ee',
        ],
      },
      { socialName: 'capybara', addresses: ['0xb77771e01bcb358f9468df78ddcb9f0cb062a772'] },
      {
        socialName: 'cojo.eth',
        addresses: [
          '0xe943ca883ef3294e0fc55a1a14591abead1b5927',
          '0xcaaa26c5498de67466e6823ef69718feb04c2952',
        ],
      },
      {
        socialName: 'renatov.eth',
        addresses: [
          '0xd47cc86868092fb56f56d78919c207ecf7593060',
          '0x6046d412b45dace6c963c7c3c892ad951ec97e57',
        ],
      },
      {
        socialName: 'tylerfoust.eth',
        addresses: [
          '0x0b001c532a98b637f5b66c55f02fc9c6645e54ca',
          '0x3d335600833f6d4075184ea5350a3f37f3b82ce1',
        ],
      },
    ],
    []
  );

  // Update useEffect to include trackedWalletsData in dependencies
  useEffect(() => {
    async function fetchTrackedWallets() {
      const results = await Promise.all(
        trackedWalletsData.map(async profile => {
          return await fetchWalletDataForProfile(profile);
        })
      );
      results.sort((a, b) => b.totalValue - a.totalValue);
      results.forEach((wallet, index) => (wallet.rank = index + 1));
      // make the shape of the data the same as the funds
      const formattedWallets = results.map(wallet => ({
        ...wallet,
        metadata: {
          performanceMetrics: {
            tvl: wallet.totalValue.toString(),
          },
        },
        type: EntityType.Wallet,
      }));
      setTrackedWallets(formattedWallets as WalletLeaderboardData[]);
    }
    fetchTrackedWallets();
  }, [trackedWalletsData]);

  const fundsWithType: FundWithMetadata[] = useMemo(() => {
    return funds.map(fund => ({
      ...fund,
      type: EntityType.Fund,
    }));
  }, [funds]);

  // Sort funds by fallback TVL (using default "0" if metrics aren't available)
  const FundsAndWallets = [...fundsWithType, ...trackedWallets].sort((a, b) => {
    const tvlA = parseFloat(a.metadata?.performanceMetrics?.tvl ?? '0');
    const tvlB = parseFloat(b.metadata?.performanceMetrics?.tvl ?? '0');
    return tvlA - tvlB;
  });

  const sortedFundsAndWallets = [...FundsAndWallets].reverse();
  console.log('sortedFunds: ', sortedFundsAndWallets);

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
            <div className="grid grid-cols-5 gap-4 border-b border-fluid-white/10 p-4 text-sm text-fluid-white-70">
              <div className="col-span-2">Fund Name</div>
              <div className="text-right">Total Investment</div>
              <div className="text-right">Performance</div>
              <div className="text-right">Rank</div>
            </div>

            {sortedFundsAndWallets.map(
              (fund: FundWithMetadata | WalletLeaderboardData, index: number) =>
                fund.type === EntityType.Fund ? (
                  <FundRow key={fund.address} fund={fund} rank={index + 1} />
                ) : (
                  <WalletRow key={fund.address} wallet={fund} rank={index + 1} />
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WalletRowProps {
  wallet: WalletLeaderboardData;
  rank: number;
}
const WalletRow = ({ wallet, rank }: WalletRowProps) => {
  const displayBalance = wallet.totalValue.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  return (
    <Link href={`/wallet/${wallet.address}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1 }}
        className="group grid cursor-pointer grid-cols-5 gap-4 p-4 text-fluid-white transition-colors hover:bg-fluid-white/[0.08]"
      >
        <div className="col-span-2 flex items-center gap-2 font-medium">
          {wallet.socialName}
          <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
        </div>
        <div className="flex items-center justify-end text-right">${displayBalance}</div>
        <div className="flex items-center justify-end text-right text-green-400">
          +{wallet.performance}%
        </div>
        <div className="flex items-center justify-end font-medium">
          <span
            className={cn(
              'flex aspect-square size-8 shrink-0 items-center justify-center rounded-full p-1',
              {
                'bg-amber-500/20 text-amber-400': rank === 1,
                'bg-gray-400/20 text-gray-400': rank === 2,
                'bg-amber-700/20 text-amber-700': rank === 3,
              }
            )}
          >
            #{rank}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

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
        className="group grid cursor-pointer grid-cols-5 gap-4 p-4 text-fluid-white transition-colors hover:bg-fluid-white/[0.08]"
      >
        <div className="col-span-2 flex items-center gap-2 font-medium">
          {name}
          <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
        </div>
        <div className="text-right">${displayBalance}</div>
        <div className="text-right text-green-400">+{performanceMetric}%</div>
        <div
          className={cn('rounded-full text-right font-medium', {
            'bg-amber-500/20 text-amber-400': rank === 1,
            'bg-gray-400/20 text-gray-400': rank === 2,
            'bg-amber-700/20 text-amber-700': rank === 3,
          })}
        >
          #{rank}
        </div>
      </motion.div>
    </Link>
  );
};
