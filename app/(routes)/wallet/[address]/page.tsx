'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  Copy,
  BarChart2,
  Zap,
  Percent,
  DollarSign,
  Award,
  Briefcase,
  Activity,
} from 'lucide-react';
import ParticleBackground from '@/app/components/ParticleBackground';
// Import the Covalent API helper
import { getFundBalances, TokenBalance } from '@/app/utils/covalent';
import BackNavigation from '@/app/components/BackNavigation';
import { copyToClipboard, formatAddress } from '@/app/utils/common';
import UserRoleBadge from '@/app/components/UserRoleBadge';

// Define types for walletData and holdings
interface WalletData {
  id: number;
  name: string;
  socialName: string;
  address: string;
  chain: string;
  totalValue: number;
  performance: number;
  rank: number;
  tags: string[];
  socialLinks: {
    twitter: string;
    youtube: string;
  };
  followers: number;
  performanceMetrics: {
    dailyROI: number;
    weeklyROI: number;
    monthlyROI: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
  };
  holdings: Holding[];
}

interface Holding {
  name: string;
  symbol: string;
  amount: number;
  value: number;
  change: number;
}

export default function WalletDetailPage() {
  const { address } = useParams() as { address: string };
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData | null>(null);

  // Wrap fetchWalletData in useCallback
  const fetchWalletData = useCallback(async (): Promise<void> => {
    try {
      if (!address) return;

      // Specify the chain ID
      const chainId = '8453';

      // 2. Get current token balances using getFundBalances
      const currentTokenBalances = await getFundBalances(address, chainId);

      // Map current token balances to your holdings interface.
      const currentHoldings = currentTokenBalances.map((token: TokenBalance) => {
        // Calculate the amount using the token decimals
        const tokenAmount = Number(token.balance) / Math.pow(10, token.contract_decimals);
        return {
          name: token.contract_name || token.contract_ticker_symbol || 'Unknown',
          symbol: token.contract_ticker_symbol || 'UNK',
          amount: tokenAmount,
          value: token.quote || 0,
          change: 0, // You could add logic here to calculate a 24h change if available
        };
      });

      // Option: If you want to display the current balances instead of the historical ones,
      // you can set holdings to the currentHoldings. Alternatively, you could merge data from both:
      const holdings = currentHoldings;

      // Recalculate total value based on current holdings if needed.
      const totalValue = holdings.reduce((sum: number, holding: Holding) => sum + holding.value, 0);

      // Build the wallet object.
      const wallet = {
        id: 0,
        name: `Wallet ${address.substring(0, 6)}`,
        socialName: '',
        address,
        chain: chainId,
        totalValue,
        performance: 0, // Performance metrics can be updated later.
        rank: 0,
        tags: [],
        socialLinks: {
          twitter: '',
          youtube: '',
        },
        followers: 0,
        performanceMetrics: {
          dailyROI: 0,
          weeklyROI: 0,
          monthlyROI: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          winRate: 0,
        },
        holdings,
      };

      setWalletData(wallet);
    } catch (error) {
      console.error('Error fetching wallet data from Covalent API:', error);
      // Optionally, display an error UI or toast message here.
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    fetchWalletData();
  }, [address, fetchWalletData]);

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-x-hidden">
        <div className="fixed inset-0 z-0">
          <ParticleBackground />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-fluid-primary"></div>
            <p className="text-sm text-white/70">Loading wallet data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-gray-900 to-black">
      {/* Background particles */}
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
      </div>

      {/* Main content */}
      <div className="relative z-10 pt-20">
        {/* Top navigation */}
        <BackNavigation href="/leaderboard" label="Leaderboard" />

        {/* Profile header */}

        <WalletHeroSection walletData={walletData} />

        {/* Main dashboard content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Performance metrics */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fluid-primary/20">
                    <BarChart2 className="h-4 w-4 text-fluid-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Performance Metrics</h2>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="mb-1 text-sm text-white/70">Daily ROI (avg)</div>
                      <div className="flex items-center text-xl font-bold text-green-400">
                        <TrendingUp className="mr-1 h-4 w-4" />+
                        {walletData?.performanceMetrics.dailyROI}%
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="mb-1 text-sm text-white/70">Weekly ROI</div>
                      <div className="flex items-center text-xl font-bold text-green-400">
                        <TrendingUp className="mr-1 h-4 w-4" />+
                        {walletData?.performanceMetrics.weeklyROI}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="mb-1 text-sm text-white/70">Monthly ROI</div>
                      <div className="flex items-center text-xl font-bold text-green-400">
                        <TrendingUp className="mr-1 h-4 w-4" />+
                        {walletData?.performanceMetrics.monthlyROI}%
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="mb-1 text-sm text-white/70">Max Drawdown</div>
                      <div className="flex items-center text-xl font-bold text-red-400">
                        <TrendingDown className="mr-1 h-4 w-4" />
                        {walletData?.performanceMetrics.maxDrawdown}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="mb-1 text-sm text-white/70">Sharpe Ratio</div>
                      <div className="text-xl font-bold text-blue-400">
                        {walletData?.performanceMetrics.sharpeRatio}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="mb-1 text-sm text-white/70">Win Rate</div>
                      <div className="flex items-center text-xl font-bold text-green-400">
                        <Percent className="mr-1 h-4 w-4" />
                        {walletData?.performanceMetrics.winRate}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                    <Zap className="h-4 w-4 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-fluid-primary p-3 font-medium text-black transition-colors hover:bg-fluid-primary/90">
                    <Briefcase className="h-4 w-4" />
                    <span>Copy Trades</span>
                  </button>

                  <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 p-3 font-medium text-white transition-colors hover:bg-white/20">
                    <TrendingUp className="h-4 w-4" />
                    <span>Place Prediction</span>
                  </button>

                  <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 p-3 font-medium text-white transition-colors hover:bg-white/20">
                    <Bell className="h-4 w-4" />
                    <span>Set Alert</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Current Holdings */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <DollarSign className="h-4 w-4 text-green-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Current Holdings</h2>
                  </div>

                  <div className="text-sm text-white/70">{walletData?.holdings.length} assets</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="w-[200px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/70">
                          Asset
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/70">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/70">
                          Value
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/70">
                          24h Change
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletData?.holdings
                        .filter((asset: Holding) => asset.value !== 0)
                        .map((asset: Holding, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-white/10 transition-colors hover:bg-white/5"
                          >
                            <td className="w-[200px] whitespace-nowrap px-6 py-4">
                              <div className="flex items-center">
                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                                  <span className="text-xs font-medium">
                                    {asset.symbol.slice(0, 1)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{asset.name}</div>
                                  <div className="text-xs text-white/70">{asset.symbol}</div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <div className="text-sm text-white">
                                {asset.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                              </div>
                              <div className="text-xs text-white/70">{asset.symbol}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <div className="text-sm font-medium text-white">
                                {formatCurrency(asset.value)}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <div
                                className={`flex items-center justify-end text-sm font-medium ${
                                  asset.change >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {asset.change >= 0 ? (
                                  <TrendingUp className="mr-1 h-3 w-3" />
                                ) : (
                                  <TrendingDown className="mr-1 h-3 w-3" />
                                )}
                                <span>
                                  {asset.change >= 0 ? '+' : ''}
                                  {asset.change}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Prediction Markets */}
              <div className="mt-6 rounded-xl border border-white/5 bg-gray-800/30 p-6 backdrop-blur-sm transition-all hover:border-white/10">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                      <Activity className="h-4 w-4 text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Related Predictions</h2>
                  </div>

                  <Link
                    href="/wallet-predictions"
                    className="text-sm text-fluid-primary hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="text-white/70">
                    This wallet is currently involved in 3 active prediction markets
                  </p>
                  <button className="mt-4 rounded-lg bg-fluid-primary px-4 py-2 font-medium text-black transition-colors hover:bg-fluid-primary/90">
                    View Predictions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components and icons
interface IconProps {
  className?: string;
}

const TrendingDown = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const Users = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const Bell = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const Wallet = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"></path>
  </svg>
);

// Helper functions
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const WalletHeroSection = ({ walletData }: { walletData: WalletData | null }) => {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800/50 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
          {/* Left side: Main details */}
          <div>
            {/* Name and social */}
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fluid-primary/20">
                <Wallet className="h-4 w-4 text-fluid-primary" />
              </div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-white md:text-4xl">
                {walletData?.name}
                {walletData && walletData.rank <= 3 && (
                  <Trophy className="h-5 w-5 text-amber-400" />
                )}
              </h1>
            </div>

            {/* Wallet address and chain */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/70">Manager:</span>
                  <code className="break-all font-mono text-sm text-white">
                    {walletData?.name ? formatAddress(walletData.name) : 'Loading...'}
                  </code>
                  {walletData?.name && (
                    <button
                      onClick={() =>
                        copyToClipboard(walletData.name, 'Manager address copied to clipboard')
                      }
                      className="rounded-md p-1 opacity-50 transition-colors hover:bg-white/10 hover:opacity-100"
                      title="Copy manager address"
                    >
                      <Copy className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
              <UserRoleBadge role={'wallet'} />
            </div>
            <WalletSocials walletData={walletData} />
          </div>

          {/* Right side: Individual Metric Cards and Social Links */}
          <WalletMetrics walletData={walletData} />
        </div>
      </div>
    </div>
  );
};

const WalletMetrics = ({ walletData }: { walletData: WalletData | null }) => {
  const metrics = [
    {
      label: 'Rank',
      labelIcon: <Award className="h-5 w-5 text-amber-400" />,
      value: walletData?.rank,
      icon: <Award className="h-5 w-5 text-amber-400" />,
    },
    {
      label: 'Performance (24h)',
      labelIcon: <BarChart2 className="h-5 w-5 text-fluid-primary" />,
      value: walletData?.performance.toFixed(2) + '%',
      icon: <TrendingUp className="h-5 w-5 text-fluid-primary" />,
    },
    {
      label: 'Performance (30d)',
      labelIcon: <BarChart2 className="h-5 w-5 text-fluid-primary" />,
      value: walletData?.performanceMetrics?.monthlyROI.toFixed(2) + '%',
      icon: <TrendingUp className="h-5 w-5 text-fluid-primary" />,
    },
    {
      label: 'Total Value',
      labelIcon: <DollarSign className="h-5 w-5 text-fluid-primary" />,
      value: formatCurrency(walletData?.totalValue ?? 0),
    },
  ];
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(metric => (
          <div
            key={metric.label}
            className="flexflex-col justify-center rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              {metric?.labelIcon}
              <p className="text-sm text-white/70">{metric.label}</p>
            </div>
            <span className="text-xl font-bold text-white">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WalletSocials = ({ walletData }: { walletData: WalletData | null }) => {
  return (
    <div className="flex w-full items-center justify-start gap-3 pt-4">
      <a
        href={walletData?.socialLinks.twitter}
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
        href={walletData?.socialLinks?.farcaster}
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
        href={walletData?.socialLinks?.alfafrens}
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
            fillRule="evenodd"
            clipRule="evenodd"
            d="M118.361 179.47C121.971 176.302 125.34 171.058 127.164 164.378C128.988 157.699 128.753 151.47 127.253 146.907C125.734 142.282 123.283 140.188 121.125 139.599C118.967 139.009 115.792 139.567 112.132 142.778C108.522 145.945 105.153 151.19 103.329 157.869C101.505 164.549 101.74 170.777 103.239 175.34C104.759 179.966 107.21 182.06 109.368 182.649C111.526 183.238 114.701 182.681 118.361 179.47ZM107.508 189.46C117.851 192.285 129.701 181.888 133.975 166.238C138.249 150.589 133.328 135.612 122.985 132.787C112.641 129.963 100.792 140.359 96.5179 156.009C92.2441 171.659 97.1645 186.635 107.508 189.46Z"
            fill="#8CFB51"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
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
        <span className="text-xs text-white">{walletData?.followers.toLocaleString()} frens</span>
      </div>
    </div>
  );
};
