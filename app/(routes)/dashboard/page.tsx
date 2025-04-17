'use client';
import { useEffect, useState, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ParticleBackground from '@/app/components/ParticleBackground';
import { CreateFundModal } from '@/app/components/CreateFundModal';
import { useFluidFundsSubgraphManager } from '@/app/hooks/useFluidFundsSubgraphManager';
import { useAccount } from 'wagmi';
import { logger } from '@/app/utils/logger';
import { formatEther } from 'viem'; // Use viem's built-in types
import { Toaster, toast } from 'sonner';
import { SUPERFLUID_FLOW_ABI } from '@/app/config/contracts';
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
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isPending, startTransition] = useTransition();

  const {
    writeContract,
    isPending: isClosing,
    isError: isCloseFundError,
    error: closeFundError,
  } = useWriteContract();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [funds, setFunds] = useState<FundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    funds: subgraphFunds,
    loading: fundsLoading,
    error: fundsError,
  } = useFluidFundsSubgraphManager(120000); // Maintained 120-second poll interval

  const refetchFunds = useCallback(async () => {
    setLoading(true);
    setFunds([]);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Maintained 5-second delay
      const formattedFunds: FundInfo[] = subgraphFunds
        .filter(fund => fund.manager.toLowerCase() === (address?.toLowerCase() || ''))
        .map(fund => ({
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
          logger.error('Subgraph funds error:', {
            error: fundsError.toString(),
            timestamp: Date.now(),
          });

          if (typeof fundsError === 'string' && fundsError.includes('429')) {
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(
                `Retrying (${retryCount}/${maxRetries}) in ${retryDelay / 1000} seconds...`
              );
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
          .map(fund => ({
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


  const handleFundCreated = useCallback(async () => {
    startTransition(() => {
      setIsCreateModalOpen(false); // Close modal immediately to prevent reload
    });
    await refetchFunds(); // Refetch funds asynchronously without blocking UI
  }, [refetchFunds, startTransition]);

  const handleCloseFund = useCallback(
    async (fundAddress: `0x${string}`) => {
      if (isClosing) return;

      const toastId = toast.loading('Closing fund...');

      try {
        await writeContract({
          address: fundAddress,
          abi: SUPERFLUID_FLOW_ABI,
          functionName: 'closeFund',
        });

        // Wait for a short delay before refetching to allow the transaction to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetchFunds();

        toast.success('Fund closed successfully', { id: toastId });
      } catch (error) {
        console.error('CloseFund error:', error);
        toast.error('Failed to close fund. Please try again.', { id: toastId });
      }
    },
    [writeContract, isClosing, refetchFunds]
  );

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
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-white">
        <div className="text-white/70">Connecting wallet...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-fluid-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-white">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.05] p-6 text-center">
          <p className="mb-4 text-white/70">{error}</p>
          <button
            onClick={() => startTransition(() => refetchFunds())}
            disabled={isPending}
            className={`rounded-lg px-4 py-2 font-medium text-white transition-colors ${
              isPending
                ? 'cursor-not-allowed bg-fluid-primary/50'
                : 'bg-fluid-primary hover:bg-fluid-primary/90'
            }`}
          >
            {isPending ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={gradientStyles.background}
    >
      <Toaster position="top-right" richColors /> {/* Updated for consistency with sonner@1.7.4 */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={gradientStyles.overlay.style}
      />
      {/* Updated Header Logo Section */}
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Enhanced Dashboard Header */}
        <div className="relative mb-8 space-y-4 text-center sm:mb-16 sm:space-y-6">
          {/* Background Text Effect */}
          <div className="absolute left-1/2 top-1/2 hidden w-full -translate-x-1/2 -translate-y-1/2 transform sm:block">
            <h2 className="pointer-events-none select-none whitespace-nowrap text-[60px] font-bold text-white/[0.02] sm:text-[120px]">
              FLUID FUNDS
            </h2>
          </div>

          {/* Main Title - Updated to match Overview color */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl"
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
            className="relative mx-auto max-w-2xl text-base leading-relaxed text-white/80 drop-shadow-[0_0_30px_rgba(37,202,172,0.1)] sm:text-lg lg:text-xl"
          >
            Create and manage your investment funds with real-time analytics and seamless control
          </motion.p>
        </div>

        {/* Rest of your dashboard content */}
        <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-3">
          {/* Stats Card */}
          <div className="rounded-2xl p-4 sm:p-6 lg:col-span-1" style={gradientStyles.glass}>
            <h2 className="mb-4 text-xl font-bold text-fluid-primary sm:mb-6 sm:text-2xl">
              Overview
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                <p className="text-xs text-white/60 sm:text-sm">Total Funds</p>
                <p className="text-2xl font-bold text-fluid-primary sm:text-3xl">{funds.length}</p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-fluid-primary py-3 text-sm font-semibold text-white shadow-lg shadow-fluid-primary/20 transition-all duration-300 hover:bg-fluid-primary/90 sm:py-4 sm:text-base"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Fund
              </button>
            </div>
          </div>

          {/* Funds List */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            {/* Your Funds Title - Updated to match Overview color */}
            <div className="mb-4 flex items-center justify-between sm:mb-8">
              <h2 className="text-2xl font-bold text-fluid-primary drop-shadow-[0_0_15px_rgba(37,202,172,0.3)] sm:text-3xl">
                Your Funds
              </h2>
              {fundsLoading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-fluid-primary border-t-transparent sm:h-6 sm:w-6" />
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {funds.map(fund => (
                <motion.div
                  key={fund.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] sm:p-6"
                  style={gradientStyles.glass}
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                      <div>
                        <h3 className="text-lg font-semibold text-fluid-primary sm:text-xl">
                          {fund.name}
                        </h3>
                        <p className="mt-1 break-all text-xs text-white/60 sm:text-sm">
                          {fund.address}
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
                        <button
                          onClick={() => handleCloseFund(fund.address)}
                          disabled={
                            isClosing || fund.manager.toLowerCase() !== address?.toLowerCase()
                          }
                          className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-all duration-300 hover:bg-red-500/20 sm:w-auto sm:px-4"
                        >
                          {isClosing ? 'Closing...' : 'Close Fund'}
                        </button>
                        <button
                          onClick={() => router.push(`/fund/${fund.address}`)}
                          className="w-full rounded-lg border border-fluid-primary/20 bg-fluid-primary/10 px-3 py-2 text-sm text-fluid-primary transition-all duration-300 hover:bg-fluid-primary/20 sm:w-auto sm:px-4"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-white/60 sm:grid-cols-2 sm:gap-4 sm:text-sm">
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
                <div className="rounded-2xl py-12 text-center" style={gradientStyles.glass}>
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
