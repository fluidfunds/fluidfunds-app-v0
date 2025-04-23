/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Wallet, LineChart, Copy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import ParticleBackground from '@/app/components/ParticleBackground';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { useFluidFundDetails } from '@/app/hooks/useFluidFundDetails';
import { TradingPanel } from '@/app/components/TradingPanel';
import { useTradeHistory } from '@/app/hooks/useTradeHistory';
import { RecentTradingActivity } from '@/app/components/RecentTradingActivity';
import { ActiveInvestors } from '@/app/components/ActiveInvestors';
import { PerformanceHistory } from '@/app/components/PerformanceHistory';
import { InvestmentDetails } from '@/app/components/InvestmentDetails';
import { useUserRole } from '@/app/hooks/useUserRole'; // Import the useUserRole hook
import InvestorDashboard from '@/app/components/InvestorDashboard'; // Add this import at the top with the other imports
import { BarChart2, TrendingUp, Users, Zap } from 'lucide-react';
import { useGetPnL } from '@/app/hooks/useGetPnL';

// Type Definitions
interface StreamInfo {
  id: string;
  sender: {
    id: string;
  };
  flowRatePerDay: number;
  currentAmount: number;
}
interface FundDetails {
  name: string;
  manager: `0x${string}`;
  profitSharingPercentage: number;
  subscriptionEndTime: number;
}
export default function FundDetailPage() {
  const params = useParams();
  const fundAddress = params?.address as string as `0x${string}`;

  const { data: pnlData, isLoading: pnlLoading, error: pnlError } = useGetPnL(fundAddress);
  const { fund, loading: fundLoading, error: fundError } = useFluidFundDetails(fundAddress);

  const { role, isManager, isLoading: roleLoading } = useUserRole(fundAddress); // Use the hook

  const [fundDetails, setFundDetails] = useState<FundDetails | null>(null);
  const {
    activeStreams,
    aggregatedStreamData,
    loading: streamsLoading,
  } = useSuperfluid(fundAddress); // Using useSuperfluid for streams
  const { isConnected } = useAccount();
  const [cachedStreams, setCachedStreams] = useState<StreamInfo[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const { trades, loading: tradesLoading } = useTradeHistory(fundAddress);

  useEffect(() => {
    if (fund) {
      setFundDetails({
        name: fund.name,
        manager: fund.manager,
        profitSharingPercentage: Number(fund.fee) / 100,
        subscriptionEndTime: fund.startTime + Number(fund.duration),
      });
    }
  }, [fund]);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateTime > 2000) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedStreams = activeStreams.map((stream: any) => ({
        id: stream.id,
        sender: {
          id: typeof stream.sender === 'object' ? stream.sender.id : 'Unknown',
        },
        flowRatePerDay: parseFloat(formatEther(BigInt(stream.flowRate))) * 86400,
        currentAmount: 0,
      }));
      setCachedStreams(transformedStreams);
      setLastUpdateTime(now);
    }
  }, [activeStreams, lastUpdateTime]);

  const formatAddress = useCallback(
    (address: string): string => `${address.slice(0, 6)}...${address.slice(-4)}`,
    []
  );

  const totalFlowRate = useMemo(
    () => cachedStreams.reduce((acc, stream) => acc + stream.flowRatePerDay, 0),
    [cachedStreams]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard');
    } catch (err: unknown) {
      toast.error('Failed to copy address');
    }
  };
  console.log(pnlData, 'pnlData');
  // Memoize the fund hero section using raw contract data
  const FundHeroSection = useMemo(
    () => (
      <div className="bg-gradient-to-r from-gray-900 to-gray-800/50 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fluid-primary/20">
                  <Wallet className="h-4 w-4 text-fluid-primary" />
                </div>
                <h1 className="text-3xl font-bold text-white md:text-4xl">
                  {fundDetails?.name || 'Loading Fund...'}
                </h1>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">Manager:</span>
                    <code className="break-all font-mono text-sm text-white">
                      {fundDetails?.manager ? formatAddress(fundDetails.manager) : 'Loading...'}
                    </code>
                    {fundDetails?.manager && (
                      <button
                        onClick={() => copyToClipboard(fundDetails.manager)}
                        className="rounded-md p-1 opacity-50 transition-colors hover:bg-white/10 hover:opacity-100"
                        title="Copy manager address"
                      >
                        <Copy className="h-3 w-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Display user role */}
                {isConnected && !roleLoading && (
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                      isManager
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <Zap className="h-4 w-4" />
                    <span>{isManager ? 'Fund Manager' : 'Investor'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics cards in hero */}
            <div className="mt-4 grid grid-cols-2 gap-4 md:mt-0">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-fluid-primary" />
                  <p className="text-sm text-white/70">Total Daily Investment</p>
                </div>
                <p className="text-xl font-bold text-white">
                  {(totalFlowRate || 0).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <p className="text-sm text-white/70">Active Investors</p>
                </div>
                <p className="text-xl font-bold text-white">{cachedStreams.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    [
      fundDetails,
      formatAddress,
      copyToClipboard,
      totalFlowRate,
      cachedStreams.length,
      isConnected,
      roleLoading,
      isManager,
    ]
  );

  // Calculate total value locked and percentage change
  const tvlMetrics = useMemo(() => {
    if (aggregatedStreamData && aggregatedStreamData.totalStreamed) {
      const totalStreamed = Number(aggregatedStreamData.totalStreamed);
      const percentageChange = totalStreamed > 0 ? (totalFlowRate / totalStreamed) * 100 : 0;
      return {
        tvl: totalStreamed,
        percentageChange,
      };
    }
    return {
      tvl: 0,
      percentageChange: 0,
    };
  }, [aggregatedStreamData, totalFlowRate]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-gray-900 to-black">
      {/* Background particles */}
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
      </div>

      {/* Loading & error states */}
      {fundLoading || roleLoading ? (
        <LoadingState />
      ) : fundError ? (
        <ErrorState error={fundError} />
      ) : (
        <div className="relative z-10">
          {/* Top navigation */}
          <NavigationBar isConnected={isConnected} />

          {/* Hero section */}
          {FundHeroSection}

          {/* Main dashboard content */}
          <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            {/* Tab navigation */}
            <DashboardTabs isManager={isManager} />

            {/* Main content grid */}
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left sidebar */}
              <FundSidebar
                fundAddress={fundAddress}
                fundDetails={fundDetails}
                isConnected={isConnected}
                isManager={isManager}
              />

              {/* Main content area */}
              <MainDashboardContent
                tvlMetrics={tvlMetrics}
                totalFlowRate={totalFlowRate || 0}
                isConnected={isConnected}
                isManager={isManager}
                cachedStreams={cachedStreams}
                fundAddress={fundAddress}
                trades={trades}
                tradesLoading={tradesLoading}
                streamsLoading={streamsLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading state component
const LoadingState = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-fluid-primary"></div>
      <p className="text-sm text-white/70">Loading fund data...</p>
    </div>
  </div>
);

// Error state component
const ErrorState = ({ error }: { error: string }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="max-w-md rounded-lg bg-red-400/10 p-6 text-center text-red-400">
      <h3 className="mb-2 text-lg font-medium">Error Loading Fund</h3>
      <p>{error}</p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-white/10 px-4 py-2 transition-colors hover:bg-white/20"
      >
        Return to Funds List
      </Link>
    </div>
  </div>
);

// Navigation bar component
const NavigationBar = ({ isConnected }: { isConnected: boolean }) => (
  <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-lg">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="group inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Funds</span>
      </Link>
      {isConnected && (
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-sm text-green-400">Connected</span>
        </div>
      )}
    </div>
  </nav>
);

// Dashboard tabs component
const DashboardTabs = ({ isManager }: { isManager: boolean }) => (
  <div className="scrollbar-hide mb-8 overflow-x-auto border-b border-white/10">
    <div className="flex space-x-8">
      <TabButton active={true} label="Overview" />
      {isManager && <TabButton active={false} label="Fund Management" />}
    </div>
  </div>
);

// Fund sidebar component
const FundSidebar = ({
  fundAddress,
  fundDetails,
  isConnected,
  isManager,
}: {
  fundAddress: `0x${string}`;
  fundDetails: FundDetails | null;
  isConnected: boolean;
  isManager: boolean;
}) => (
  <div className="space-y-6 lg:col-span-3">
    <InvestmentDetails
      fundAddress={fundAddress}
      fundDetails={fundDetails}
      isConnected={isConnected}
    />
    {/* InvestorDashboard has been moved to the main content area */}
  </div>
);

// Main dashboard content component
const MainDashboardContent = ({
  tvlMetrics,
  totalFlowRate,
  cachedStreams,
  isConnected,
  isManager,
  fundAddress,
  trades,
  tradesLoading,
  streamsLoading,
}: {
  tvlMetrics: { tvl: number; percentageChange: number };
  totalFlowRate: number;
  cachedStreams: StreamInfo[];
  isConnected: boolean;
  isManager: boolean;
  fundAddress: `0x${string}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trades: any[];
  tradesLoading: boolean;
  streamsLoading: boolean;
}) => {
  const [showAllTrades, setShowAllTrades] = useState(false);
  return (
    <div className="space-y-6 lg:col-span-9">
      {/* InvestorDashboard for connected non-manager users */}
      {isConnected && !isManager && (
        <div className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Your Investment</h2>
          </div>
          <InvestorDashboard fundAddress={fundAddress} />
        </div>
      )}

      {/* Trading panel - manager only */}
      {isManager && (
        <div className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
              <LineChart className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Trading Panel</h2>
          </div>
          <TradingPanel fundAddress={fundAddress} />
        </div>
      )}

      {/* Performance section with 100% width */}
      <div className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Performance History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              Last 7 Days
            </button>
            <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              Last 30 Days
            </button>
          </div>
        </div>
        <PerformanceHistory
          fundAddress={fundAddress}
          tvl={tvlMetrics.tvl}
          percentageChange={tvlMetrics.percentageChange}
        />
      </div>

      {/* Split layout for trading and investors */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trading activity section */}
        <div className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                <LineChart className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Recent Trading</h2>
            </div>
            <button
              onClick={() => setShowAllTrades(!showAllTrades)}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {showAllTrades ? 'View Less' : 'View All'}
            </button>
          </div>
          <RecentTradingActivity trades={trades} loading={tradesLoading} showAll={showAllTrades} />
        </div>

        {/* Investors section */}
        <div className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Active Investors</h2>
            </div>
            <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              View All
            </button>
          </div>
          <ActiveInvestors streams={cachedStreams} loading={streamsLoading} />
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, label }: { active: boolean; label: string }) => (
  <button
    className={`relative whitespace-nowrap px-2 py-4 text-base font-medium transition-colors ${
      active
        ? 'border-b-2 border-fluid-primary text-fluid-primary'
        : 'text-white/60 hover:text-white/90'
    }`}
  >
    {label}
  </button>
);

// Metric Card Component
const MetricCard = ({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-white/5 bg-gray-800/50 p-5 backdrop-blur-sm transition-all hover:border-white/10">
    <div className="mb-3 flex items-start justify-between">
      <p className="text-sm text-white/70">{title}</p>
      {icon || <BarChart2 className="h-4 w-4 text-white/40" />}
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {change !== undefined && (
      <div
        className={`mt-2 flex items-center text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}
      >
        <TrendingUp className={`mr-1 h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
        <span>
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      </div>
    )}
  </div>
);

// Helper function for currency formatting
const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
