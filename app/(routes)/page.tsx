'use client';
import { motion } from 'framer-motion';
import ProcessSteps from '../components/ProcessSteps';
import ParticleBackground from '@/app/components/ParticleBackground';
import HeroCarousel from '../components/HeroCarousel';
import { useEffect, useState, memo, useCallback } from 'react';
import { CustomConnectButton } from '../components/CustomConnectButton';
import FundCard from '@/app/components/FundCard';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { logger } from '@/app/utils/logger';
import { useFluidFundsSubgraphManager } from '@/app/hooks/useFluidFundsSubgraphManager';

interface FundInfo {
  address: `0x${string}`; // Final processed fund address
  name: string;
  manager: `0x${string}`;
  createdAt: number; // Processed timestamp
  blockNumber: number;
  fee: number;
}

const FundsGrid = memo(
  ({ funds, loading }: { funds: FundInfo[]; loading: boolean }) => {
    console.log('FundsGrid rendered:', { fundsLength: funds.length, loading });
    return loading ? (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-fluid-primary/20 border-t-fluid-primary" />
          <div className="mt-4 text-fluid-primary/80">Loading funds...</div>
        </div>
      </div>
    ) : funds.length > 0 ? (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {funds.map(fund => (
          <FundCard key={fund.address} fund={fund} />
        ))}
      </div>
    ) : (
      <div className="text-center text-white/70">No funds found.</div>
    );
  },
  (prevProps, nextProps) => {
    const processFunds = (funds: FundInfo[]) => {
      return funds.map(fund => ({
        ...fund,
        fee: Number(fund.fee), // Convert BigInt to number
      }));
    };

    return (
      prevProps.loading === nextProps.loading &&
      JSON.stringify(processFunds(prevProps.funds)) ===
        JSON.stringify(processFunds(nextProps.funds))
    );
  }
);
FundsGrid.displayName = 'FundsGrid';

export default function Home() {
  const [trendingFunds, setTrendingFunds] = useState<FundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleStartFund = async () => {
    if (!isConnected) return;
    router.push('/dashboard');
  };

  const {
    funds: subgraphFunds,
    loading: fundsLoading,
    error: fundsError,
  } = useFluidFundsSubgraphManager();

  const fetchFunds = useCallback(async () => {
    setLoading(true);
    try {
      if (fundsLoading || fundsError) {
        if (fundsError) {
          console.error('Subgraph funds error:', fundsError);
          logger.error('Subgraph funds error:', { error: fundsError, timestamp: Date.now() });
        }
        setLoading(false); // Ensure loading is set to false even on error
        return;
      }

      logger.log('Subgraph funds received:', { funds: subgraphFunds, timestamp: Date.now() });

      // Filter out duplicates and ensure unique addresses
      const uniqueFunds = Array.from(
        new Map(subgraphFunds.map(fund => [fund.address, fund])).values()
      );
      const formattedFunds: FundInfo[] = uniqueFunds.map(fund => ({
        address: fund.address,
        name: fund.name || `Fund ${fund.address.slice(0, 6)}`, // Fallback for name
        manager: fund.manager,
        //@ts-expect-error - BigInt to number conversion
        createdAt: fund.createdAt,
        blockNumber: fund.blockNumber,
        fee: Number(fund.fee) / 100, // Divide by 100 to convert from basis points to percentage
      }));

      setTrendingFunds(formattedFunds);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch funds';
      console.error('Error formatting funds:', errorMsg);
      logger.error('Error fetching funds:', { error: err, timestamp: Date.now() });
      setTrendingFunds([]); // Reset to empty array on error to prevent crashes
    } finally {
      setLoading(false);
    }
  }, [subgraphFunds, fundsLoading, fundsError]);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    fetchFunds();

    intervalId = setInterval(() => {
      if (mounted) fetchFunds();
    }, 15000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchFunds]);

  if (!isConnected) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-fluid-bg text-fluid-white">
        <ParticleBackground />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(circle at top, rgba(55, 0, 110, 0.15), transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />
        <main className="relative z-10 flex flex-col items-center justify-center px-6 pb-[100px] pt-[180px]">
          <div className="flex w-full max-w-7xl flex-col items-center gap-[35px]">
            <div
              id="features"
              className="mx-auto flex w-full max-w-[840px] flex-col items-center gap-6"
            >
              <div className="w-full overflow-hidden">
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="text-center"
                >
                  <h1 className="mb-0 text-[56px] font-medium leading-[1.2] tracking-[-0.02em] text-[rgb(37,202,172)]">
                    <span className="inline">Are You Tired of </span>
                    <span className="inline">Rug-Pulls?</span>
                  </h1>
                </motion.div>
              </div>
              <div className="w-full overflow-hidden">
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="text-center"
                >
                  <h2 className="text-[56px] font-medium leading-[1] tracking-[-0.02em] text-[rgb(37,202,172)]">
                    Trade with Confidence.
                  </h2>
                </motion.div>
              </div>
              <div className="max-w-[620px] overflow-hidden">
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  className="text-center"
                >
                  <motion.p
                    className="px-4 text-[20px] leading-[1.4] text-[rgba(255,255,255,0.7)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    A safe platform for fund owners and managers to trade whitelisted tokens with
                    high market caps, ensuring security and transparency in every transaction.
                  </motion.p>
                </motion.div>
              </div>
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                >
                  <HeroCarousel />
                </motion.div>
              </div>
            </div>

            <div id="process" className="w-full">
              <ProcessSteps />
            </div>

            <motion.a
              className="mx-auto block w-full max-w-4xl px-6 py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-fluid-white/10 bg-gradient-to-br from-fluid-bg/40 to-fluid-primary/10 p-8 backdrop-blur-lg">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fluid-primary/10 to-purple-500/10 opacity-30" />
                <div className="relative z-10">
                  <div className="mb-8 text-center">
                    <h3 className="mb-4 text-3xl font-medium text-fluid-primary">
                      Create Your Fund
                    </h3>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-fluid-white/70">
                      Create your own hedge fund in minutes and start managing assets with our
                      secure, transparent, and professional-grade platform.
                    </p>
                    <div className="space-y-6">
                      <div className="flex flex-col items-center gap-3">
                        <CustomConnectButton />
                        <span className="text-sm text-fluid-white/50">
                          Connect your wallet to create your fund
                        </span>
                      </div>
                      <div className="mt-8 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-5 w-5 text-fluid-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Low Gas Fees</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-5 w-5 text-fluid-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Instant Setup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-5 w-5 text-fluid-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Secure Platform</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.a>

            <motion.div
              id="funds"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="w-full py-20"
            >
              <div className="mx-auto max-w-[1200px] px-4">
                <div className="mb-16 text-center">
                  <h2 className="mb-4 bg-gradient-to-r from-fluid-primary to-purple-500 bg-clip-text text-[40px] font-medium text-transparent">
                    Smart Investing Made Simple
                  </h2>
                  <p className="mx-auto max-w-2xl text-xl text-white/70">
                    Get professional-grade returns with automated investment strategies. Start with
                    as little as 100 USDC.
                  </p>
                </div>
                <FundsGrid funds={trendingFunds} loading={loading} />
              </div>
            </motion.div>
          </div>
        </main>
        <footer className="border-t border-fluid-white-10 py-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <span className="font-medium text-fluid-primary">FluidFunds</span>
            <a
              href="https://x.com/fluidfunds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fluid-white-70 transition-colors hover:text-fluid-white"
            >
              Follow us on X
            </a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-fluid-bg text-fluid-white">
      <ParticleBackground />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at top, rgba(55, 0, 110, 0.15), transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pb-[100px] pt-[180px]">
        <div className="flex w-full max-w-7xl flex-col items-center gap-[35px]">
          <div
            id="features"
            className="mx-auto flex w-full max-w-[840px] flex-col items-center gap-6"
          >
            <div className="w-full overflow-hidden">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-center"
              >
                <h1 className="mb-0 text-[56px] font-medium leading-[1.2] tracking-[-0.02em] text-[rgb(37,202,172)]">
                  <span className="inline">Are You Tired of </span>
                  <span className="inline">Rug-Pulls?</span>
                </h1>
              </motion.div>
            </div>
            <div className="w-full overflow-hidden">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="text-center"
              >
                <h2 className="text-[56px] font-medium leading-[1] tracking-[-0.02em] text-[rgb(37,202,172)]">
                  Trade with Confidence.
                </h2>
              </motion.div>
            </div>
            <div className="max-w-[620px] overflow-hidden">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="text-center"
              >
                <motion.p
                  className="px-4 text-[20px] leading-[1.4] text-[rgba(255,255,255,0.7)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  A safe platform for fund owners and managers to trade whitelisted tokens with high
                  market caps, ensuring security and transparency in every transaction.
                </motion.p>
              </motion.div>
            </div>
            <div className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              >
                <HeroCarousel />
              </motion.div>
            </div>
          </div>

          <div id="process" className="w-full">
            <ProcessSteps />
          </div>

          <motion.div
            className="mx-auto w-full max-w-4xl px-6 py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-fluid-white/10 bg-gradient-to-br from-fluid-bg/40 to-fluid-primary/10 p-8 backdrop-blur-lg">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fluid-primary/10 to-purple-500/10 opacity-30" />
              <div className="relative z-10">
                <div className="mb-8 text-center">
                  <h3 className="mb-4 text-3xl font-medium text-fluid-primary">Create Your Fund</h3>
                  <p className="mx-auto mb-8 max-w-2xl text-lg text-fluid-white/70">
                    Create your own hedge fund in minutes and start managing assets with our secure,
                    transparent, and professional-grade platform.
                  </p>
                  {!isConnected ? (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center gap-3">
                        <CustomConnectButton />
                        <span className="text-sm text-fluid-white/50">
                          Connect your wallet to create your fund
                        </span>
                      </div>
                      <div className="mt-8 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-5 w-5 text-fluid-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Low Gas Fees</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-5 w-5 text-fluid-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Instant Setup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-5 w-5 text-fluid-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Secure Platform</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={handleStartFund}
                        className="transform rounded-xl bg-fluid-primary px-8 py-4 font-medium shadow-lg shadow-fluid-primary/20 transition-all duration-200 hover:scale-105 hover:bg-fluid-primary/90"
                      >
                        Create Your Hedge Fund
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            id="funds"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="w-full py-20"
          >
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="mb-16 text-center">
                <h2 className="mb-4 bg-gradient-to-r from-fluid-primary to-purple-500 bg-clip-text text-[40px] font-medium text-transparent">
                  Smart Investing Made Simple
                </h2>
                <p className="mx-auto max-w-2xl text-xl text-white/70">
                  Get professional-grade returns with automated investment strategies. Start with as
                  little as 100 USDC.
                </p>
              </div>
              <FundsGrid funds={trendingFunds} loading={loading} />
            </div>
          </motion.div>
        </div>
      </main>
      <footer className="border-t border-fluid-white-10 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <span className="font-medium text-fluid-primary">FluidFunds</span>
          <a
            href="https://x.com/fluidfunds"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fluid-white-70 transition-colors hover:text-fluid-white"
          >
            Follow us on X
          </a>
        </div>
      </footer>
    </div>
  );
}
