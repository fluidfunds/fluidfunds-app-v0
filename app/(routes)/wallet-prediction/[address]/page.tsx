'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  Copy, 
  Share2, 
  Hash, 
  BarChart2, 
  Zap, 
  Percent, 
  DollarSign, 
  Award, 
  Briefcase, 
  Activity,
} from 'lucide-react';
import ParticleBackground from '@/app/components/ParticleBackground';
import { toast } from 'sonner';
// Import the Covalent API helper
import {  getFundBalances, TokenBalance } from '@/app/utils/covalent';

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
  const router = useRouter();
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
          youtube: ''
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
      console.error("Error fetching wallet data from Covalent API:", error);
      // Optionally, display an error UI or toast message here.
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    fetchWalletData();
  }, [address, fetchWalletData]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy address');
    }
  };

  const shareProfile = () => {
    toast.success('Share link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-x-hidden">
        <div className="fixed inset-0 z-0">
          <ParticleBackground />
        </div>
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fluid-primary"></div>
            <p className="text-white/70 text-sm">Loading wallet data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative overflow-x-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Top navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white 
                      transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Prediction Market</span>
            </button>
            
            <button 
              onClick={shareProfile}
              className="bg-fluid-primary text-black font-medium py-2 px-4 rounded-full hover:bg-fluid-primary/90 transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Profile</span>
            </button>
          </div>
        </nav>
        
        {/* Profile header */}
        <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left side: Main details */}
              <div className="flex flex-col gap-4 flex-1">
                {/* Name and social */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-fluid-primary/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-fluid-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                      {walletData?.name}
                      {walletData && walletData.rank <= 3 && (
                        <Trophy className="w-5 h-5 text-amber-400" />
                      )}
                    </h1>
                    <p className="text-white/70">{walletData?.socialName}</p>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {walletData?.tags.map((tag: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/90"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Wallet address and chain */}
                <div className="flex flex-col gap-2 w-full max-w-l">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm w-full">
                    <Hash className="w-4 h-4 text-white/50" />
                    <span className="text-white/70 text-sm">Wallet:</span>
                    <code className="text-white font-mono text-sm break-all">
                      {walletData?.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(walletData?.address || '')}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors opacity-50 hover:opacity-100 ml-auto"
                      title="Copy wallet address"
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm w-full">
                    <span className="text-white/70 text-sm">Chain:</span>
                    <span className="text-white text-sm">{walletData?.chain}</span>
                  </div>
                  
                  {/* Social links */}
                  <div className="flex items-center gap-3">
                    <a 
                      href={walletData?.socialLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                      title="Twitter/X"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a 
                      href={walletData?.socialLinks.youtube} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                      title="YouTube"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </a>
                    <div className="px-3 py-1 bg-white/5 rounded-full flex items-center gap-2">
                      <Users className="w-3 h-3 text-white/70" />
                      <span className="text-white text-xs">{walletData?.followers.toLocaleString()} followers</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side: Individual Metric Cards */}
              <div className="flex flex-col gap-4 h-full justify-between">
                <div className="grid grid-cols-4 gap-4 h-full">
                  {/* Rank Card */}
                  <div className="bg-white/5 px-5 py-6 rounded-xl text-center h-full flex flex-col justify-center">
                    <p className="text-white/70 text-sm">Rank</p>
                    <div className="flex items-center justify-center mt-2">
                      <span className="text-2xl font-bold text-white">#{walletData?.rank}</span>
                      <Award className="w-5 h-5 text-amber-400 ml-2" />
                    </div>
                  </div>
                  {/* 24h Performance Card */}
                  <div className="bg-white/5 px-5 py-6 rounded-xl text-center h-full flex flex-col justify-center">
                    <p className="text-white/70 text-sm">Performance (24h)</p>
                    <div className="flex items-center justify-center mt-2">
                      <TrendingUp className="w-5 h-5 text-fluid-primary mr-2" />
                      <span className="text-2xl font-bold text-white">
                        +{walletData?.performance.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {/* Last 30d Performance Card */}
                  <div className="bg-white/5 px-5 py-6 rounded-xl text-center h-full flex flex-col justify-center">
                    <p className="text-white/70 text-sm">Performance (30d)</p>
                    <div className="flex items-center justify-center mt-2">
                      {walletData?.performanceMetrics?.monthlyROI ? (
                        <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
                      )}
                      <span className="text-2xl font-bold text-white">
                        +{walletData?.performanceMetrics.monthlyROI.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {/* Total Value Card */}
                  <div className="bg-white/5 px-5 py-6 rounded-xl text-center h-full flex flex-col justify-center">
                    <p className="text-white/70 text-sm">Total Value</p>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-white">
                        {formatCurrency(walletData?.totalValue ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main dashboard content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance metrics */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-8 w-8 rounded-full bg-fluid-primary/20 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-fluid-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Performance Metrics</h2>
                </div>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm mb-1">Daily ROI (avg)</div>
                      <div className="text-xl font-bold text-green-400 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{walletData?.performanceMetrics.dailyROI}%
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm mb-1">Weekly ROI</div>
                      <div className="text-xl font-bold text-green-400 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{walletData?.performanceMetrics.weeklyROI}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm mb-1">Monthly ROI</div>
                      <div className="text-xl font-bold text-green-400 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{walletData?.performanceMetrics.monthlyROI}%
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm mb-1">Max Drawdown</div>
                      <div className="text-xl font-bold text-red-400 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        {walletData?.performanceMetrics.maxDrawdown}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm mb-1">Sharpe Ratio</div>
                      <div className="text-xl font-bold text-blue-400">
                        {walletData?.performanceMetrics.sharpeRatio}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm mb-1">Win Rate</div>
                      <div className="text-xl font-bold text-green-400 flex items-center">
                        <Percent className="w-4 h-4 mr-1" />
                        {walletData?.performanceMetrics.winRate}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-gray-800/30 rounded-xl p-6 mt-6 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button className="w-full p-3 bg-fluid-primary text-black font-medium rounded-lg hover:bg-fluid-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Copy Trades</span>
                  </button>
                  
                  <button className="w-full p-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Place Prediction</span>
                  </button>
                  
                  <button className="w-full p-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span>Set Alert</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Current Holdings */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Current Holdings</h2>
                  </div>
                  
                  <div className="text-sm text-white/70">
                    {walletData?.holdings.length} assets
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider w-[200px]">
                          Asset
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
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
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap w-[200px]">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
                                  <span className="text-xs font-medium">{asset.symbol.slice(0, 1)}</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{asset.name}</div>
                                  <div className="text-xs text-white/70">{asset.symbol}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm text-white">
                                {asset.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                              </div>
                              <div className="text-xs text-white/70">{asset.symbol}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-medium text-white">
                                {formatCurrency(asset.value)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div
                                className={`text-sm font-medium flex items-center justify-end ${
                                  asset.change >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {asset.change >= 0 ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
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
              <div className="bg-gray-800/30 rounded-xl p-6 mt-6 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Related Predictions</h2>
                  </div>
                  
                  <Link href="/wallet-predictions" className="text-sm text-fluid-primary hover:underline">
                    View All
                  </Link>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <p className="text-white/70">This wallet is currently involved in 3 active prediction markets</p>
                  <button className="mt-4 px-4 py-2 bg-fluid-primary text-black font-medium rounded-lg hover:bg-fluid-primary/90 transition-colors">
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
    maximumFractionDigits: 0
  }).format(value);
}