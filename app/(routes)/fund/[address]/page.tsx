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
              <div className="flex w-full items-center justify-start gap-3 pt-4">
                <a
                  href={'#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10"
                  title="X/Twitter"
                >
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href={'#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10"
                  title="Farcaster"
                >
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.22 15.89C4.07 18.76 6.76 21 10 21h4c3.24 0 5.93-2.24 6.78-5.11.31-1.05.42-2.12.39-3.19l-1.01.93a4.99 4.99 0 0 1-6.46.37l-2.37-1.81-2.38 1.81a4.99 4.99 0 0 1-6.46-.37l-1.01-.93c-.03 1.07.08 2.14.39 3.19zM21 11.63a8 8 0 0 0-16 0" />
                  </svg>
                </a>
                <a
                  href={'#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10"
                  title="Alfafrens"
                >
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 290 269"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.52002 162.566L55.7419 268.32H225.961L289.48 146.309L238.305 136.897L270.811 60.9621L217.24 72.3417L225.054 26.0105L178.533 48.4133L157.175 0L116.813 48.4133L80.5738 27.6362L72.76 90.224L25.6823 70.7161L48.4095 155.25L0.52002 162.566Z"
                      fill="#0400F5"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M118.361 179.47C121.971 176.302 125.34 171.058 127.164 164.378C128.988 157.699 128.753 151.47 127.253 146.907C125.734 142.282 123.283 140.188 121.125 139.599C118.967 139.009 115.792 139.567 112.132 142.778C108.522 145.945 105.153 151.19 103.329 157.869C101.505 164.549 101.74 170.777 103.239 175.34C104.759 179.966 107.21 182.06 109.368 182.649C111.526 183.238 114.701 182.681 118.361 179.47ZM107.508 189.46C117.851 192.285 129.701 181.888 133.975 166.238C138.249 150.589 133.328 135.612 122.985 132.787C112.641 129.963 100.792 140.359 96.5179 156.009C92.2441 171.659 97.1645 186.635 107.508 189.46Z"
                      fill="#8CFB51"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M188.626 140.072C189.858 141.754 189.493 144.117 187.811 145.349L166.332 161.077L187.62 175.408C189.35 176.573 189.808 178.919 188.644 180.649C187.479 182.379 185.133 182.837 183.403 181.672L159.505 165.584C156.435 163.517 156.346 159.03 159.332 156.843L183.349 139.256C185.032 138.024 187.394 138.389 188.626 140.072Z"
                      fill="#8CFB51"
                    />
                    <path
                      d="M165.517 201.135C167.28 202.223 167.845 204.551 166.554 206.172C164.029 209.343 160.903 212.001 157.342 213.989C152.687 216.587 147.443 217.952 142.111 217.952C136.779 217.952 131.536 216.588 126.88 213.989C123.32 212.002 120.194 209.343 117.668 206.173C116.377 204.552 116.942 202.223 118.706 201.135C120.469 200.048 122.761 200.62 124.112 202.191C125.923 204.295 128.096 206.074 130.537 207.436C134.075 209.411 138.059 210.448 142.111 210.448C146.163 210.448 150.147 209.411 153.685 207.436C156.126 206.073 158.299 204.295 160.11 202.191C161.462 200.62 163.753 200.047 165.517 201.135Z"
                      fill="#8CFB51"
                    />
                  </svg>
                </a>
                <div className="flex h-8 items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <Users className="h-3 w-3 text-white/70" />
                  <span className="text-xs text-white">0 frens</span>
                </div>
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
