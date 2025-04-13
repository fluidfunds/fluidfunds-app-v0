"use client";
import { useEffect, useState, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Logo } from '@/app/components/icons/Logo';
import ParticleBackground from '@/app/components/ParticleBackground';
import { CreateFundModal } from '@/app/components/CreateFundModal';
import { useFluidFundsSubgraphManager } from '@/app/hooks/useFluidFundsSubgraphManager';
import { useAccount, useDisconnect } from 'wagmi';
import { logger } from '@/app/utils/logger';
import { formatEther} from 'viem'; // Use viem's built-in types
import { Toaster, toast } from 'sonner';
import {SUPERFLUID_FLOW_ABI } from '@/app/config/contracts';
import { useWriteContract } from 'wagmi';

// Custom date formatting function
const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

interface FundInfo {
  id: string; // Unique identifier from subgraph
  address: `0x${string}`; // Fund address (fundAddress from subgraph)
  name: string; // Fund name
  manager: `0x${string}`; // Manager address
  fee: bigint; // Fee in wei (e.g., USDC or basis points)
  startTime: number; // Timestamp of fund start (in seconds)
  duration: bigint; // Fund duration in seconds
  blockNumber: number; // Block number of fund creation
  blockTimestamp: number; // This is effectively the createdAt timestamp
  transactionHash: `0x${string}`; // Transaction hash of fund creation
}

const gradientStyles = {
  background: {
    backgroundImage: 'linear-gradient(180deg, #0A0A0A 0%, #13111C 100%)',
  },
  overlay: {
    style: {
      background: `
        radial-gradient(circle at 0% 0%, rgba(37,202,172,0.12) 0%, transparent 50%),
        radial-gradient(circle at 100% 0%, rgba(89,9,121,0.12) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(37,202,172,0.08) 0%, transparent 50%),
        radial-gradient(circle at 0% 100%, rgba(89,9,121,0.08) 0%, transparent 50%)
      `,
      mixBlendMode: 'screen' as const,
    },
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isPending, startTransition] = useTransition();

  const {
    writeContract,
    isPending: isClosing,
    isError: isCloseFundError,
    error: closeFundError
  } = useWriteContract();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [funds, setFunds] = useState<FundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { funds: subgraphFunds, loading: fundsLoading, error: fundsError } = useFluidFundsSubgraphManager(120000); // Maintained 120-second poll interval

  const refetchFunds = useCallback(async () => {
    setLoading(true);
    setFunds([]);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Maintained 5-second delay
      const formattedFunds: FundInfo[] = subgraphFunds
        .filter(fund => fund.manager.toLowerCase() === (address?.toLowerCase() || ''))
        .map((fund) => ({
          id: fund.id,
          address: fund.address as `0x${string}`,
          name: fund.name,
          manager: fund.manager as `0x${string}`,
          fee: fund.fee,
          startTime: fund.startTime,
          duration: fund.duration,
          blockNumber: fund.blockNumber,
          blockTimestamp: fund.blockTimestamp,
          transactionHash: fund.transactionHash as `0x${string}`,
        }));
      setFunds(formattedFunds);
      toast.success('Funds refreshed successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refetch funds';
      console.error('Refetch error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [subgraphFunds, address]);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 3000; // Maintained 3-second delay

    const loadFunds = async () => {
      if (fundsLoading || fundsError) {
        if (mounted) setLoading(fundsLoading);
        if (fundsError) {
          console.error('Subgraph funds error:', fundsError);
          logger.error('Subgraph funds error:', { error: fundsError.toString(), timestamp: Date.now() });

          if (typeof fundsError === 'string' && fundsError.includes('429')) {
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying (${retryCount}/${maxRetries}) in ${retryDelay / 1000} seconds...`);
              setTimeout(loadFunds, retryDelay);
              return;
            } else {
              setError('Too many requests to subgraph. Please try again later.');
              if (mounted) setLoading(false);
              return;
            }
          }
          setError(fundsError.toString());
        }
        return;
      }

      try {
        const formattedFunds: FundInfo[] = subgraphFunds
          .filter(fund => fund.manager.toLowerCase() === (address?.toLowerCase() || ''))
          .map((fund) => ({
            id: fund.id,
            address: fund.address as `0x${string}`,
            name: fund.name,
            manager: fund.manager as `0x${string}`,
            fee: fund.fee,
            startTime: fund.startTime,
            duration: fund.duration,
            blockNumber: fund.blockNumber,
            blockTimestamp: fund.blockTimestamp,
            transactionHash: fund.transactionHash as `0x${string}`,
          }));

        if (mounted) {
          startTransition(() => {
            setFunds(formattedFunds);
            setLoading(false);
            setError(null);
          });
        }
      } catch (error) {
        console.error('Error formatting funds:', error);
        if (mounted) {
          startTransition(() => {
            setLoading(false);
            setError(error instanceof Error ? error.message : 'Failed to format funds');
          });
        }
      }
    };

    loadFunds();

    return () => {
      mounted = false;
    };
  }, [subgraphFunds, fundsLoading, fundsError, address, startTransition]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      router.replace('/');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, router]);

  const handleFundCreated = useCallback(async () => {
    startTransition(() => {
      setIsCreateModalOpen(false); // Close modal immediately to prevent reload
    });
    await refetchFunds(); // Refetch funds asynchronously without blocking UI
  }, [refetchFunds, startTransition]);

  const handleCloseFund = useCallback(async (fundAddress: `0x${string}`) => {
    if (isClosing) return;
  
    const toastId = toast.loading('Closing fund...');
  
    try {
      await writeContract({
        address: fundAddress,
        abi: SUPERFLUID_FLOW_ABI,
        functionName: 'closeFund'
      });
  
      // Wait for a short delay before refetching to allow the transaction to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetchFunds();
      
      toast.success('Fund closed successfully', { id: toastId });
    } catch (error) {
      console.error('CloseFund error:', error);
      toast.error('Failed to close fund. Please try again.', { id: toastId });
    }
  }, [writeContract, isClosing, refetchFunds]);

  // Handle contract interaction states
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (isCloseFundError && closeFundError && lastErrorRef.current !== closeFundError.message) {
      lastErrorRef.current = closeFundError.message;
      // Schedule the toast to run after render
      setTimeout(() => {
        toast.error(`Failed to close fund: ${closeFundError.message}`);
      }, 0);
    }
  }, [isCloseFundError, closeFundError]);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-white/70">Connecting wallet...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fluid-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center p-6 bg-white/[0.05] rounded-lg border border-white/[0.08]">
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={() => startTransition(() => refetchFunds())}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isPending ? 'bg-fluid-primary/50 cursor-not-allowed' : 'bg-fluid-primary hover:bg-fluid-primary/90'
            }`}
          >
            {isPending ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={gradientStyles.background}>
      <Toaster position="top-right" richColors /> {/* Updated for consistency with sonner@1.7.4 */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
      </div>
      <div className="absolute inset-0 pointer-events-none z-10" style={gradientStyles.overlay.style} />

      {/* Updated Header Logo Section */}
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-black/30">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <Logo className="w-8 h-8 sm:w-10 sm:h-10 text-fluid-primary transition-transform group-hover:scale-110" />
            <span className="font-bold text-lg sm:text-2xl text-fluid-primary drop-shadow-[0_0_15px_rgba(37,202,172,0.2)]">
              FluidFunds
            </span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="px-2 sm:px-4 py-2 rounded-full" style={gradientStyles.glass}>
              <span className="text-xs sm:text-sm text-white/80">
                {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 sm:px-4 py-2 text-sm rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-300"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Enhanced Dashboard Header */}
        <div className="relative mb-8 sm:mb-16 text-center space-y-4 sm:space-y-6">
          {/* Background Text Effect */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full hidden sm:block">
            <h2 className="text-[60px] sm:text-[120px] font-bold text-white/[0.02] select-none pointer-events-none whitespace-nowrap">
              FLUID FUNDS
            </h2>
          </div>
          
          {/* Main Title - Updated to match Overview color */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold"
          >
            <span className="text-fluid-primary drop-shadow-[0_0_30px_rgba(37,202,172,0.2)]">
              Fund Manager Dashboard
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed
              drop-shadow-[0_0_30px_rgba(37,202,172,0.1)]"
          >
            Create and manage your investment funds with real-time analytics and seamless control
          </motion.p>
        </div>

        {/* Rest of your dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Stats Card */}
          <div className="lg:col-span-1 p-4 sm:p-6 rounded-2xl" style={gradientStyles.glass}>
            <h2 className="text-xl sm:text-2xl font-bold text-fluid-primary mb-4 sm:mb-6">Overview</h2>
            <div className="space-y-4">
              <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs sm:text-sm text-white/60">Total Funds</p>
                <p className="text-2xl sm:text-3xl font-bold text-fluid-primary">{funds.length}</p>
              </div>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-3 sm:py-4 rounded-xl bg-fluid-primary hover:bg-fluid-primary/90 text-white text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-fluid-primary/20"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Fund
              </button>
            </div>
          </div>

          {/* Funds List */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Your Funds Title - Updated to match Overview color */}
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-fluid-primary
                drop-shadow-[0_0_15px_rgba(37,202,172,0.3)]">
                Your Funds
              </h2>
              {fundsLoading && (
                <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-fluid-primary border-t-transparent rounded-full" />
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {funds.map((fund) => (
                <motion.div
                  key={fund.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-6 rounded-2xl hover:scale-[1.01] transition-all duration-300"
                  style={gradientStyles.glass}
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-fluid-primary">{fund.name}</h3>
                        <p className="text-xs sm:text-sm text-white/60 mt-1 break-all">{fund.address}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => handleCloseFund(fund.address)}
                          disabled={isClosing || fund.manager.toLowerCase() !== address?.toLowerCase()}
                          className="px-3 sm:px-4 py-2 text-sm rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-300 w-full sm:w-auto"
                        >
                          {isClosing ? 'Closing...' : 'Close Fund'}
                        </button>
                        <button
                          onClick={() => router.push(`/fund/${fund.address}`)}
                          className="px-3 sm:px-4 py-2 text-sm rounded-lg bg-fluid-primary/10 hover:bg-fluid-primary/20 text-fluid-primary border border-fluid-primary/20 transition-all duration-300 w-full sm:w-auto"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-white/60">
                      <div>
                        <p>Started: {formatDate(fund.startTime)}</p>
                        <p>Duration: {Number(fund.duration) / (24 * 60 * 60)} days</p>
                      </div>
                      <div>
                        <p>Fee: {formatEther(fund.fee)} USDC</p>
                        <p>Created: {formatDate(fund.blockTimestamp)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {funds.length === 0 && !loading && (
                <div className="text-center py-12 rounded-2xl" style={gradientStyles.glass}>
                  <p className="text-white/60">No funds found for this wallet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <CreateFundModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onFundCreated={handleFundCreated}
      />
    </div>
  );
}