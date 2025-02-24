/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, LineChart, Copy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';
import ParticleBackground from '@/app/components/ParticleBackground';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { RecentTradingActivity } from '@/app/components/RecentTradingActivity';
import { useFluidFundDetails } from '@/app/hooks/useFluidFundDetails';

// Add this mock data generation function at the top of your file
const generateMockPerformanceData = () => {
  const data = [];
  let value = 1000000; // Starting value
  const days = 90; // 3 months of data
  
  for (let i = 0; i < days; i++) {
    // Generate random daily change between -2% and +2%
    const change = (Math.random() * 4 - 2) / 100;
    value = value * (1 + change);
    
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: value,
      // Add secondary metrics
      benchmark: value * (1 + (Math.random() * 0.4 - 0.2))
    });
  }
  return data;
};

// Type Definitions
interface StreamInfo {
  id: string;
  sender: {
    id: string;
  };
  flowRatePerDay: number;
  currentAmount: number;
}

interface Stream {
  id: string;
  sender: {
    id: string;
  };
  flowRate: string;
  currentAmount?: string;
}

interface FundDetails {
  name: string;
  manager: `0x${string}`;
  profitSharingPercentage: number;
  subscriptionEndTime: number;
}

type FundData = [
  string,         // name
  `0x${string}`,  // manager address
  bigint,         // profitSharingPercentage
  bigint,         // subscriptionEndTime
  bigint,         // minInvestmentAmount
  boolean         // active
];

interface AddressRowProps {
  label: string;
  address: string;
  showFull?: boolean;
}

interface FundPerformanceChartProps {
  tvl: number;
  percentageChange: number;
}

const FundPerformanceChart = ({ tvl, percentageChange }: FundPerformanceChartProps) => {
  const data = useMemo(() => generateMockPerformanceData(), []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-white/60 text-sm mb-1">{label}</p>
          <p className="text-white font-medium">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-white/60 text-sm">
            Benchmark: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-white/60 text-sm">Total Value Locked</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(tvl)}
          </p>
          <p className={`text-sm flex items-center gap-1 ${percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <LineChart className="w-3 h-3" />
            {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-white/60 text-sm">Monthly Returns</p>
          <p className="text-2xl font-bold text-white">+24.5%</p>
          <p className="text-green-400 text-sm">vs. ETH +12.3%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-white/60 text-sm">Win Rate</p>
          <p className="text-2xl font-bold text-white">78%</p>
          <p className="text-white/60 text-sm">42 trades</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/5 rounded-lg p-4 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="benchmark"
              stroke="#9333ea"
              fillOpacity={1}
              fill="url(#colorBenchmark)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Return Metrics */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/60">Daily</p>
          <p className="text-green-400 font-medium">+2.1%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/60">Weekly</p>
          <p className="text-green-400 font-medium">+8.4%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/60">Monthly</p>
          <p className="text-green-400 font-medium">+24.5%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/60">All Time</p>
          <p className="text-green-400 font-medium">+156.3%</p>
        </div>
      </div>
    </div>
  );
};

export default function FundDetailPage() {
  const params = useParams();
  const fundAddress = (params?.address as string) as `0x${string}`;
  
  const { fund, loading: fundLoading, error: fundError } = useFluidFundDetails(fundAddress);
  
  const [fundDetails, setFundDetails] = useState<FundDetails | null>(null);
  const [streamAmount, setStreamAmount] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { createStream, activeStreams, loading: streamsLoading } = useSuperfluid(fundAddress); // Using useSuperfluid for streams
  const { isConnected } = useAccount();
  const [cachedStreams, setCachedStreams] = useState<StreamInfo[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  const handleCreateStream = async () => {
    if (!streamAmount) {
      toast.error('Please enter a stream amount');
      return;
    }

    setIsStreaming(true);
    try {
      const hash = await createStream(fundAddress, streamAmount);
      console.log('Stream created with hash:', hash);
      toast.success('Stream created successfully!');
      setStreamAmount('');
    } catch (error: unknown) {
      console.error('Error creating stream:', error);
      toast.error('Failed to create stream. Please ensure you have enough USDCx balance.');
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (fund) {
      setFundDetails({
        name: fund.name,
        manager: fund.manager,
        profitSharingPercentage: Number(fund.fee) / 100,
        subscriptionEndTime: fund.startTime + Number(fund.duration)
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
          id: typeof stream.sender === 'object' ? stream.sender.id : 'Unknown'
        },
        flowRatePerDay: parseFloat(formatEther(BigInt(stream.flowRate))) * 86400,
        currentAmount: 0
      }));
      setCachedStreams(transformedStreams);
      setLastUpdateTime(now);
    }
  }, [activeStreams, lastUpdateTime]);

  const formatAddress = useCallback((address: string): string => 
    `${address.slice(0, 6)}...${address.slice(-4)}`, []);

  const totalFlowRate = useMemo(() => 
    cachedStreams.reduce((acc, stream) => acc + stream.flowRatePerDay, 0),
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

  // Memoize the active investors section
  const ActiveInvestorsSection = useMemo(() => (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-white mb-4">Active Investors</h3>
      <div className="bg-white/[0.02] rounded-xl backdrop-blur-sm border border-white/[0.08] max-w-full">
        {streamsLoading && cachedStreams.length === 0 ? (
          <div className="p-6 text-center text-white/60">Loading investors...</div>
        ) : cachedStreams.length > 0 ? (
          <div className="divide-y divide-white/[0.08]">
            {cachedStreams.map((stream) => (
              <div key={stream.id} className="p-4 space-y-4">
                {/* Address Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-fluid-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 text-fluid-primary" />
                    </div>
                    <span className="text-white/60 text-sm">Investor Address:</span>
                  </div>
                  <div className="ml-10 bg-black/20 rounded-lg p-2 flex items-center gap-2 group">
                    <code className="text-white/90 text-xs sm:text-sm font-mono break-all">
                      {stream.sender.id}
                    </code>
                    <button
                      onClick={() => copyToClipboard(stream.sender.id)}
                      className="p-1.5 hover:bg-white/10 rounded-md transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100"
                      title="Copy address"
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4 ml-10">
                  <div className="bg-white/[0.02] rounded-lg p-3">
                    <p className="text-sm text-white/60 mb-1">Daily Flow</p>
                    <p className="text-white font-medium">
                      {stream.flowRatePerDay.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3">
                    <p className="text-sm text-white/60 mb-1">Total Invested</p>
                    <p className="text-white font-medium">
                      {stream.currentAmount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-white/60">
            No active investors yet
          </div>
        )}
      </div>
    </div>
  ), [cachedStreams, streamsLoading, copyToClipboard]);

  // Add new MemoizedAddressDisplay component
  const AddressDisplay = useMemo(() => {
    const AddressRow = ({ label, address, showFull = false }: AddressRowProps) => (
      <div className="flex flex-col py-3 border-b border-white/[0.05] space-y-1">
        <span className="text-white/60 text-sm">{label}</span>
        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 group">
          <code className="text-white/90 text-xs sm:text-sm font-mono break-all">
            {showFull ? address : formatAddress(address)}
          </code>
          <button
            onClick={() => copyToClipboard(address)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100"
            title="Copy address"
          >
            <Copy className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    );

    return (
      <div className="bg-black/20 rounded-lg p-4 space-y-2">
        <AddressRow label="Fund Address" address={fundAddress} showFull={true} />
        {fundDetails?.manager && (
          <AddressRow label="Fund Manager" address={fundDetails.manager} />
        )}
        <div className="flex justify-between items-center pt-3">
          <span className="text-white/60">Fund Fee</span>
          <span className="text-white font-medium">
            {fundDetails ? `${fundDetails.profitSharingPercentage}%` : '--'}
          </span>
        </div>
      </div>
    );
  }, [fundAddress, fundDetails, formatAddress, copyToClipboard]);

  // Memoize the fund hero section using raw contract data
  const FundHeroSection = useMemo(() => (
    <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              {fundDetails?.name || 'Loading Fund...'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                <Wallet className="w-4 h-4 text-fluid-primary" />
                <div className="flex items-center gap-2">
                  <span className="text-white/70">Manager:</span>
                  <code className="text-white font-mono text-sm break-all">
                    {fundDetails?.manager || 'Loading...'}
                  </code>
                  {fundDetails?.manager && (
                    <button
                      onClick={() => copyToClipboard(fundDetails.manager)}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors opacity-50 hover:opacity-100"
                      title="Copy manager address"
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full">
                <LineChart className="w-4 h-4" />
                <span>+24.5% Past Month</span>
              </div>
            </div>
          </div>

          {/* Rest of hero section stats */}
          <div className="flex gap-6 mt-6 md:mt-0">
            <div>
              <p className="text-white/60 text-sm">Total Daily Investment</p>
              <p className="text-2xl font-bold text-white">
                {(totalFlowRate || 0).toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Active Investors</p>
              <p className="text-2xl font-bold text-white">{cachedStreams.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [fundDetails, copyToClipboard, totalFlowRate, cachedStreams.length]);

  // Calculate total value locked and percentage change
  const tvlMetrics = useMemo(() => {
    const totalInvested = cachedStreams.reduce((acc, stream) => acc + stream.currentAmount, 0);
    // Calculate 24h change based on flow rates
    const dailyInflow = totalFlowRate || 0;
    const percentageChange = totalInvested > 0 
      ? (dailyInflow / totalInvested) * 100 
      : 0;

    return {
      tvl: totalInvested,
      percentageChange
    };
  }, [cachedStreams, totalFlowRate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <ParticleBackground />
      
      {fundLoading ? (
        // Show loading state
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : fundError ? (
        // Show error state
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-400 bg-red-400/10 p-4 rounded-lg">
            {fundError}
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white 
                        transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Funds</span>
              </Link>
              {isConnected && (
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
              )}
            </div>
          </nav>

          {/* Updated Hero Section */}
          {FundHeroSection}

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Investment Panel */}
              <div className="space-y-6">
                {/* Investment Card with improved styling */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.03] rounded-xl p-6 backdrop-blur-sm border border-white/[0.08] sticky top-24"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Investment Details</h3>
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span>Open for Investment</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {AddressDisplay}

                    {!isConnected ? (
                      <div className="text-center py-6">
                        <Wallet className="w-12 h-12 text-fluid-primary mx-auto mb-3" />
                        <h4 className="text-white font-medium mb-2">Connect Your Wallet</h4>
                        <p className="text-white/60 text-sm mb-4">
                          Connect your wallet to start investing
                        </p>
                        <div className="flex justify-center">
                          <ConnectButton 
                            chainStatus="icon"
                            showBalance={false}
                            accountStatus={{
                              smallScreen: "avatar",
                              largeScreen: "full",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Existing investment form code */}
                        <div>
                          <label htmlFor="streamAmount" className="block text-sm text-white/60 mb-2">
                            Monthly Investment Amount
                          </label>
                          <div className="relative">
                            <input
                              id="streamAmount"
                              type="number"
                              value={streamAmount}
                              onChange={(e) => setStreamAmount(e.target.value)}
                              placeholder="Enter amount"
                              className="w-full h-12 px-4 rounded-lg bg-black/20 border border-white/10 
                                      text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary
                                      transition-colors"
                              min="0"
                              step="0.01"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                              USDC/month
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleCreateStream}
                          disabled={isStreaming || !streamAmount}
                          className="w-full h-12 rounded-lg bg-fluid-primary text-white font-semibold
                                  hover:bg-fluid-primary/90 transition-all duration-200 disabled:opacity-50
                                  disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isStreaming ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                              />
                              <span>Processing...</span>
                            </>
                          ) : (
                            'Invest Now'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Active Investors List - Mobile only */}
                <div className="lg:hidden">
                  {ActiveInvestorsSection}
                </div>
              </div>

              {/* Center and Right Columns */}
              <div className="lg:col-span-2 space-y-8">
                {/* Updated Performance History Section */}
                <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Performance History</h2>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-white/60 hover:text-white transition-colors">
                        1M
                      </button>
                      <button className="px-3 py-1.5 rounded-full text-sm bg-fluid-primary text-white">
                        3M
                      </button>
                      <button className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-white/60 hover:text-white transition-colors">
                        1Y
                      </button>
                    </div>
                  </div>
                  <FundPerformanceChart 
                    tvl={tvlMetrics.tvl} 
                    percentageChange={tvlMetrics.percentageChange}
                  />
                </div>

                {/* Active Investors - Desktop only */}
                <div className="hidden lg:block">
                  {ActiveInvestorsSection}
                </div>

                {/* Trading Activity with improved styling */}
                <div className="bg-white/[0.02] rounded-xl backdrop-blur-sm border border-white/[0.08] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Recent Trading Activity</h3>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <LineChart className="w-4 h-4" />
                      <span>10 most recent trades</span>
                    </div>
                  </div>
                  <RecentTradingActivity />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}