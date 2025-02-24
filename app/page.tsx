"use client";
import { motion } from 'framer-motion';
import Header from './components/Header';
import FAQ from './components/FAQ';
import Benefits from './components/Benefits';
import ProcessSteps from './components/ProcessSteps';
import ParticleBackground from '@/app/components/ParticleBackground';
import HeroCarousel from './components/HeroCarousel';
import { useEffect, useState, memo, useCallback } from 'react';
import { CustomConnectButton } from './components/CustomConnectButton';
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

const FundsGrid = memo(({ funds, loading }: { funds: FundInfo[]; loading: boolean }) => {
  console.log('FundsGrid rendered:', { fundsLength: funds.length, loading });
  return loading ? (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-fluid-primary/20 border-t-fluid-primary animate-spin" />
        <div className="mt-4 text-fluid-primary/80">Loading funds...</div>
      </div>
    </div>
  ) : funds.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {funds.map((fund) => (
        <FundCard key={fund.address} fund={fund} />
      ))}
    </div>
  ) : (
    <div className="text-center text-white/70">No funds found.</div>
  );
}, (prevProps, nextProps) => {
  const processFunds = (funds: FundInfo[]) => {
    return funds.map(fund => ({
      ...fund,
      fee: Number(fund.fee) // Convert BigInt to number
    }));
  };

  return (
    prevProps.loading === nextProps.loading &&
    JSON.stringify(processFunds(prevProps.funds)) === JSON.stringify(processFunds(nextProps.funds))
  );
});
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

  const { funds: subgraphFunds, loading: fundsLoading, error: fundsError } = useFluidFundsSubgraphManager();

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
      const uniqueFunds = Array.from(new Map(subgraphFunds.map(fund => [fund.address, fund])).values());
      const formattedFunds: FundInfo[] = uniqueFunds.map((fund) => ({
        address: fund.address,
        name: fund.name || `Fund ${fund.address.slice(0, 6)}`, // Fallback for name
        manager: fund.manager,
        //@ts-expect-error - BigInt to number conversion
        createdAt: fund.createdAt,
        blockNumber: fund.blockNumber,
        fee: Number(fund.fee) / 100 // Divide by 100 to convert from basis points to percentage
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
      <div className="relative min-h-screen bg-fluid-bg text-fluid-white overflow-hidden">
        <ParticleBackground />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top, rgba(55, 0, 110, 0.15), transparent 70%)', mixBlendMode: 'screen' }}
        />
        <Header />
        <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-[180px] pb-[100px]">
          <div className="flex flex-col items-center gap-[35px] w-full max-w-7xl">
            <div id="features" className="flex flex-col items-center gap-6 w-full max-w-[840px] mx-auto">
              <div className="overflow-hidden w-full">
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="text-center"
                >
                  <h1 className="text-[56px] leading-[1.2] tracking-[-0.02em] font-medium mb-0 text-[rgb(37,202,172)]">
                    <span className="inline">Are You Tired of </span>
                    <span className="inline">Rug-Pulls?</span>
                  </h1>
                </motion.div>
              </div>
              <div className="overflow-hidden w-full">
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="text-center"
                >
                  <h2 className="text-[56px] leading-[1] tracking-[-0.02em] font-medium text-[rgb(37,202,172)]">
                    Trade with Confidence.
                  </h2>
                </motion.div>
              </div>
              <div className="overflow-hidden max-w-[620px]">
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  className="text-center"
                >
                  <motion.p
                    className="text-[20px] leading-[1.4] text-[rgba(255,255,255,0.7)] px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    A safe platform for fund owners and managers to trade whitelisted tokens 
                    with high market caps, ensuring security and transparency in every transaction.
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
              className="w-full max-w-4xl mx-auto py-16 px-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-fluid-bg/40 to-fluid-primary/10 
                              backdrop-blur-lg rounded-2xl p-8 border border-fluid-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-fluid-primary/10 to-purple-500/10 
                                opacity-30 pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-medium text-fluid-primary mb-4">
                      Create Your Fund
                    </h3>
                    <p className="text-lg text-fluid-white/70 max-w-2xl mx-auto mb-8">
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
                      <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-fluid-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Low Gas Fees</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-fluid-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Instant Setup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-fluid-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Secure Platform</span>
                        </div>
                      </div>
                    </div>
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
              <div className="max-w-[1200px] mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-[40px] font-medium mb-4 bg-gradient-to-r from-fluid-primary to-purple-500 bg-clip-text text-transparent">
                    Smart Investing Made Simple
                  </h2>
                  <p className="text-xl text-white/70 max-w-2xl mx-auto">
                    Get professional-grade returns with automated investment strategies. Start with as little as 100 USDC.
                  </p>
                </div>
                <FundsGrid funds={trendingFunds} loading={loading} />
              </div>
            </motion.div>

            <div id="benefits" className="mt-32">
              <Benefits />
            </div>

            <div id="faq" className="mt-32">
              <FAQ />
            </div>
          </div>
        </main>
        <footer className="border-t border-fluid-white-10 py-8">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <span className="text-fluid-primary font-medium">FluidFunds</span>
            <a
              href="https://x.com/fluidfunds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fluid-white-70 hover:text-fluid-white transition-colors"
            >
              Follow us on X
            </a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-fluid-bg text-fluid-white overflow-hidden">
      <ParticleBackground />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top, rgba(55, 0, 110, 0.15), transparent 70%)', mixBlendMode: 'screen' }}
      />
      <Header />
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-[180px] pb-[100px]">
        <div className="flex flex-col items-center gap-[35px] w-full max-w-7xl">
          <div id="features" className="flex flex-col items-center gap-6 w-full max-w-[840px] mx-auto">
            <div className="overflow-hidden w-full">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-center"
              >
                <h1 className="text-[56px] leading-[1.2] tracking-[-0.02em] font-medium mb-0 text-[rgb(37,202,172)]">
                  <span className="inline">Are You Tired of </span>
                  <span className="inline">Rug-Pulls?</span>
                </h1>
              </motion.div>
            </div>
            <div className="overflow-hidden w-full">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="text-center"
              >
                <h2 className="text-[56px] leading-[1] tracking-[-0.02em] font-medium text-[rgb(37,202,172)]">
                  Trade with Confidence.
                </h2>
              </motion.div>
            </div>
            <div className="overflow-hidden max-w-[620px]">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="text-center"
              >
                <motion.p
                  className="text-[20px] leading-[1.4] text-[rgba(255,255,255,0.7)] px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  A safe platform for fund owners and managers to trade whitelisted tokens 
                  with high market caps, ensuring security and transparency in every transaction.
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
            className="w-full max-w-4xl mx-auto py-16 px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-fluid-bg/40 to-fluid-primary/10 
                            backdrop-blur-lg rounded-2xl p-8 border border-fluid-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-fluid-primary/10 to-purple-500/10 
                              opacity-30 pointer-events-none" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-medium text-fluid-primary mb-4">
                    Create Your Fund
                  </h3>
                  <p className="text-lg text-fluid-white/70 max-w-2xl mx-auto mb-8">
                    Create your own hedge fund in minutes and start managing assets with our 
                    secure, transparent, and professional-grade platform.
                  </p>
                  {!isConnected ? (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center gap-3">
                        <CustomConnectButton />
                        <span className="text-sm text-fluid-white/50">
                          Connect your wallet to create your fund
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-fluid-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Low Gas Fees</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-fluid-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Instant Setup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-fluid-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-fluid-white/70">Secure Platform</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={handleStartFund}
                        className="px-8 py-4 bg-fluid-primary rounded-xl font-medium 
                                hover:bg-fluid-primary/90 transition-all duration-200 
                                transform hover:scale-105 shadow-lg shadow-fluid-primary/20"
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
            <div className="max-w-[1200px] mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-[40px] font-medium mb-4 bg-gradient-to-r from-fluid-primary to-purple-500 bg-clip-text text-transparent">
                  Smart Investing Made Simple
                </h2>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                  Get professional-grade returns with automated investment strategies. Start with as little as 100 USDC.
                </p>
              </div>
              <FundsGrid funds={trendingFunds} loading={loading} />
            </div>
          </motion.div>

          <div id="benefits" className="mt-32">
            <Benefits />
          </div>

          <div id="faq" className="mt-32">
            <FAQ />
          </div>
        </div>
      </main>
      <footer className="border-t border-fluid-white-10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <span className="text-fluid-primary font-medium">FluidFunds</span>
          <a
            href="https://x.com/fluidfunds"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fluid-white-70 hover:text-fluid-white transition-colors"
          >
            Follow us on X
          </a>
        </div>
      </footer>
    </div>
  );
}