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
  const { trades, loading: tradesLoading } = useTradeHistory(fundAddress);

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
                <InvestmentDetails
                  fundAddress={fundAddress}
                  fundDetails={fundDetails}
                  isConnected={isConnected}
                  
                />

                {/* Active Investors List - Mobile only */}
                <div className="lg:hidden">
                  <ActiveInvestors streams={cachedStreams} loading={streamsLoading} />
                </div>
              </div>

              {/* Center and Right Columns */}
              <div className="lg:col-span-2 space-y-8">
                {/* Trading Panel */}
                <TradingPanel fundAddress={fundAddress} />

                {/* Performance History Section */}
                <PerformanceHistory 
                  tvl={tvlMetrics.tvl} 
                  percentageChange={tvlMetrics.percentageChange}
                />

               

                {/* Trading Activity with improved styling */}
                <RecentTradingActivity trades={trades} loading={tradesLoading} />

                 {/* Active Investors - Desktop only */}
                 <div className="hidden lg:block">
                  <ActiveInvestors streams={cachedStreams} loading={streamsLoading} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}