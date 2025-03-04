'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Activity, BarChart2, Zap, TrendingUp, Wallet, TrendingDown } from 'lucide-react';
import ParticleBackground from '@/app/components/ParticleBackground';
import { useRouter } from 'next/navigation';
import { fetchWalletDataForProfile, WalletData } from '@/app/utils/getWalletData';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function WalletPredictionMarketPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [activeWalletType, setActiveWalletType] = useState('evm');
  const [trackedWallets, setTrackedWallets] = useState<WalletData[]>([]);
  const router = useRouter();

  // Each tracked profile includes a socialName and one or more addresses.
  const trackedWalletsData = [
    { socialName: "basefreakz", addresses: ["0xcde9f00116bffe9852b2cd4295446ae5fc51ad0a"] },
    { socialName: "brycekrispy.eth", addresses: ["0x8ce92c44b81d6b7366a66f25bbf078bfd78829d2", "0xcdb53d17f1b829030b4fe0e3e106c2d4db33ac2a"] },
    { socialName: "bleu.eth", addresses: ["0xc4239467a62edaad4a098235a6754579e6662566", "0x38a0d87bdeac77ac859ac910a588cf80a05d854d", "0xe9dadd9ded105d67e6cb7aadc48be0c2d45df652"] },
    { socialName: "maretus", addresses: ["0x59140f80e6146d3e23a3f44c3c47c9164e4b4a98", "0x2225349cdf7f16156d7e4fd5eef774fef180cec1", "0xd9c0e850a086aa5febd40f2668c5d7e15d7d74a2", "0xcb69c793478a7355178979ae0be453bf61c378ee"] },
    { socialName: "capybara", addresses: ["0xb77771e01bcb358f9468df78ddcb9f0cb062a772"] },
    { socialName: "cojo.eth", addresses: ["0xe943ca883ef3294e0fc55a1a14591abead1b5927", "0xcaaa26c5498de67466e6823ef69718feb04c2952"] },
    { socialName: "renatov.eth", addresses: ["0xd47cc86868092fb56f56d78919c207ecf7593060", "0x6046d412b45dace6c963c7c3c892ad951ec97e57"] },
    { socialName: "tylerfoust.eth", addresses: ["0x0b001c532a98b637f5b66c55f02fc9c6645e54ca", "0x3d335600833f6d4075184ea5350a3f37f3b82ce1"] },
  ];

  // Fetch detailed wallet data for each tracked wallet (similar to your detail page)
  useEffect(() => {
    async function fetchTrackedWallets() {
      const results = await Promise.all(
        trackedWalletsData.map(async (profile) => {
          // fetchWalletDataForProfile returns an object with totalValue, performance, etc.
          return await fetchWalletDataForProfile(profile);
        })
      );

      // Sort by totalValue (descending) and assign rank
      results.sort((a, b) => b.totalValue - a.totalValue);
      results.forEach((wallet, index) => (wallet.rank = index + 1));
      setTrackedWallets(results);
    }
    fetchTrackedWallets();
  }, [trackedWalletsData]);

  // Use the live tracked data for EVM wallets if available;
  // otherwise fall back to your filtered sample data.
  // (For Solana wallets, you can build similar logic.)
  const topWallets = [
    {
      id: 1,
      name: 'CryptoWhale',
      socialName: '@whale_trader',
      totalValue: 2450000,
      performance: 42.8,
      last30dPerformance: 156.4,
      rank: 1,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      network: 'evm'
    },
    {
      id: 2,
      name: 'DefiKing',
      socialName: '@defi_king',
      totalValue: 1870000,
      performance: 36.5,
      last30dPerformance: 128.9,
      rank: 2,
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      network: 'evm'
    },
    {
      id: 3,
      name: 'TokenMaster',
      socialName: '@token_master',
      totalValue: 1250000,
      performance: 31.2,
      last30dPerformance: 98.5,
      rank: 3,
      address: '0x1111111111111111111111111111111111111111',
      network: 'evm'
    },
    {
      id: 4,
      name: 'AlphaSeeker',
      socialName: '@alpha_seek',
      totalValue: 980000,
      performance: 28.7,
      last30dPerformance: 82.3,
      rank: 4,
      address: 'So1anaAddressAlphaSeeker',
      network: 'solana'
    },
    {
      id: 5,
      name: 'CryptoNinja',
      socialName: '@crypto_ninja',
      totalValue: 750000,
      performance: 23.4,
      last30dPerformance: 65.8,
      rank: 5,
      address: 'So1anaAddressCryptoNinja',
      network: 'solana'
    },
  ];
  const filteredWallets = topWallets.filter(wallet => wallet.network === activeWalletType);
  const displayedWallets =
    activeWalletType === 'evm' && trackedWallets.length > 0
      ? trackedWallets
      : filteredWallets;
  
  // Active prediction market data
  const activePredictions = [
    {
      id: 1,
      wallet1: { name: 'CryptoWhale', performance: 42.8, odds: 1.5 },
      wallet2: { name: 'DefiKing', performance: 36.5, odds: 2.8 },
      totalBets: 125000,
      endTime: new Date(Date.now() + 86400000 * 3), // 3 days from now
    },
    {
      id: 2,
      wallet1: { name: 'TokenMaster', performance: 31.2, odds: 2.1 },
      wallet2: { name: 'AlphaSeeker', performance: 28.7, odds: 1.8 },
      totalBets: 85000,
      endTime: new Date(Date.now() + 86400000 * 5), // 5 days from now
    },
  ];
  
  // Completed prediction market data
  const completedPredictions = [
    {
      id: 3,
      wallet1: { name: 'CryptoWhale', performance: 38.6, odds: 1.7, winner: true },
      wallet2: { name: 'TokenMaster', performance: 31.5, odds: 2.2, winner: false },
      totalBets: 210000,
      endTime: new Date(Date.now() - 86400000 * 2), // 2 days ago
    },
    {
      id: 4,
      wallet1: { name: 'DefiKing', performance: 22.3, odds: 2.5, winner: false },
      wallet2: { name: 'CryptoNinja', performance: 29.4, odds: 1.9, winner: true },
      totalBets: 150000,
      endTime: new Date(Date.now() - 86400000 * 4), // 4 days ago
    },
  ];
  
  // Statistics for the top cards
  const stats = {
    topPerformers: displayedWallets.length,
    activePredictions: activePredictions.length,
    totalBetsValue: activePredictions.reduce((sum, prediction) => sum + prediction.totalBets, 0) + 
                   completedPredictions.reduce((sum, prediction) => sum + prediction.totalBets, 0)
  };
  
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white 
                      transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Funds</span>
            </Link>
            
            <button className="bg-fluid-primary text-black font-medium py-2 px-4 rounded-full hover:bg-fluid-primary/90 transition-colors">
              Connect Wallet
            </button>
          </div>
        </nav>
        
        {/* Hero section */}
        <div className="pt-10 pb-14 px-4 sm:px-6 lg:px-8 ">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Wallet Prediction Market
              </h1>
              <p className="text-white/70 text-lg">
                Bet on which wallet will have better performance over a specific time period
              </p>
            </div>
          </div>
        </div>
        
        {/* Main dashboard content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-white font-medium">Top Performers</h3>
              </div>
              <p className="text-2xl font-bold text-white mb-2">{stats.topPerformers}</p>
              <p className="text-white/70 text-sm">Discover the highest performing wallets based on historical returns</p>
              <p className="text-white/50 text-xs mt-1">and tracked wallet numbers</p>
            </div>
            
            <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-white font-medium">Active Predictions</h3>
              </div>
              <p className="text-2xl font-bold text-white mb-2">{stats.activePredictions}</p>
              <p className="text-white/70 text-sm">Currently running wallet performance predictions</p>
              <p className="text-white/50 text-xs mt-1">{stats.activePredictions} LIVE predictions status</p>
            </div>
            
            <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-white font-medium">Total Bets</h3>
              </div>
              <p className="text-2xl font-bold text-white mb-2">{formatCurrency(stats.totalBetsValue)}</p>
              <p className="text-white/70 text-sm">Total value locked in prediction markets</p>
              <p className="text-white/50 text-xs mt-1">value across all predictions</p>
            </div>
          </div>
          
          {/* Wallet Leaderboard */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-fluid-primary/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-fluid-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Wallet Leaderboard</h2>
            </div>
            
            {/* Tabs for EVM and Solana wallets */}
            <div className="flex space-x-8 mb-4">
              <button
                onClick={() => setActiveWalletType('evm')}
                className={`py-2 px-4 font-medium text-base whitespace-nowrap transition-colors ${
                  activeWalletType === 'evm'
                    ? 'text-fluid-primary border-b-2 border-fluid-primary'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                EVM
              </button>
              <button
                onClick={() => setActiveWalletType('solana')}
                className={`py-2 px-4 font-medium text-base whitespace-nowrap transition-colors ${
                  activeWalletType === 'solana'
                    ? 'text-fluid-primary border-b-2 border-fluid-primary'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                Solana
              </button>
            </div>

            <div className="bg-gray-800/30 rounded-xl overflow-hidden backdrop-blur-sm border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Social Name</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Total Value</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Performance (24h)</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Performance (30d)</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedWallets.map((wallet) => (
                      <tr
                        key={wallet.address}
                        onClick={() => router.push(`/wallet-prediction/${wallet.address}`)}
                        className="cursor-pointer hover:bg-white/5"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`https://warpcast.com/${wallet.socialName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white underline"
                          >
                            {wallet.socialName}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(wallet.totalValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-fluid-primary">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>{wallet.performance.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {wallet.last30dPerformance >= 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1 text-red-400" />
                            )}
                            <span>{wallet.last30dPerformance.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                                wallet.rank === 1
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : wallet.rank === 2
                                    ? 'bg-gray-400/20 text-gray-400'
                                    : wallet.rank === 3
                                      ? 'bg-amber-700/20 text-amber-700'
                                      : 'bg-white/10 text-white/70'
                              }`}
                            >
                              #{wallet.rank}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Prediction Market Section */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-fluid-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-fluid-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Prediction Markets</h2>
            </div>
            
            {/* Tabs */}
            <div className="mb-6 border-b border-white/10">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`py-4 px-2 relative font-medium text-base whitespace-nowrap transition-colors
                    ${activeTab === 'active'
                      ? 'text-fluid-primary border-b-2 border-fluid-primary'
                      : 'text-white/60 hover:text-white/90'
                    }`}
                >
                  Active Predictions
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`py-4 px-2 relative font-medium text-base whitespace-nowrap transition-colors
                    ${activeTab === 'completed'
                      ? 'text-fluid-primary border-b-2 border-fluid-primary'
                      : 'text-white/60 hover:text-white/90'
                    }`}
                >
                  Completed Predictions
                </button>
              </div>
            </div>
            
            {/* Prediction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'active' 
                ? activePredictions.map(prediction => (
                    <PredictionCard 
                      key={prediction.id} 
                      prediction={prediction} 
                      isActive={true}
                    />
                  ))
                : completedPredictions.map(prediction => (
                    <PredictionCard 
                      key={prediction.id} 
                      prediction={prediction} 
                      isActive={false}
                    />
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Prediction {
  id: number;
  wallet1: {
    name: string;
    performance: number;
    odds: number;
    winner?: boolean;
  };
  wallet2: {
    name: string;
    performance: number;
    odds: number;
    winner?: boolean;
  };
  totalBets: number;
  endTime: Date;
}

interface PredictionCardProps {
  prediction: Prediction;
  isActive: boolean;
}

function PredictionCard({ prediction, isActive }: PredictionCardProps) {
  const timeRemaining = isActive ? getTimeRemaining(prediction.endTime) : '';
  
  return (
    <div className="bg-gray-800/30 rounded-xl overflow-hidden backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all">
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-fluid-primary" />
          <h3 className="text-white font-medium">1v1 Wallet Prediction</h3>
        </div>
        {isActive ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            LIVE
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
            COMPLETED
          </span>
        )}
      </div>
      
      {/* Card Body */}
      <div className="p-4">
        {/* Wallets comparison */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          {/* Wallet 1 */}
          <div className={`flex-1 p-3 rounded-lg ${
            !isActive && prediction.wallet1.winner 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-white/5'
          }`}>
            <div className="text-sm text-white/70 mb-1">Wallet 1</div>
            <div className="font-medium text-white">{prediction.wallet1.name}</div>
            <div className="flex items-center mt-2 text-fluid-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+{prediction.wallet1.performance.toFixed(2)}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <span className="text-white/50 text-sm">VS</span>
          </div>
          
          {/* Wallet 2 */}
          <div className={`flex-1 p-3 rounded-lg ${
            !isActive && prediction.wallet2.winner 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-white/5'
          }`}>
            <div className="text-sm text-white/70 mb-1">Wallet 2</div>
            <div className="font-medium text-white">{prediction.wallet2.name}</div>
            <div className="flex items-center mt-2 text-fluid-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+{prediction.wallet2.performance.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        
        {/* Betting odds */}
        <div className="flex justify-between gap-3 mb-4">
          <div className="flex-1 p-2 bg-white/5 rounded text-center">
            <div className="text-xs text-white/70 mb-1">Odds</div>
            <div className="font-medium text-white">{prediction.wallet1.odds.toFixed(2)}x</div>
          </div>
          
          <div className="flex-1 p-2 bg-white/5 rounded text-center">
            <div className="text-xs text-white/70 mb-1">Odds</div>
            <div className="font-medium text-white">{prediction.wallet2.odds.toFixed(2)}x</div>
          </div>
        </div>
        
        {/* Prediction details */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2 bg-white/5 rounded">
            <div className="text-xs text-white/70 mb-1">Total Bets</div>
            <div className="font-medium text-white">{formatCurrency(prediction.totalBets)}</div>
          </div>
          
          <div className="p-2 bg-white/5 rounded">
            <div className="text-xs text-white/70 mb-1">
              {isActive ? "Ends in" : "Ended"}
            </div>
            <div className="font-medium text-white">
              {isActive ? timeRemaining : formatDate(prediction.endTime)}
            </div>
          </div>
        </div>
        
        {/* Action button */}
        {isActive ? (
          <button className="w-full p-3 bg-fluid-primary text-black font-medium rounded-lg hover:bg-fluid-primary/90 transition-colors">
            Place Bet
          </button>
        ) : (
          <button className="w-full p-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors">
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
// Helper functions
function getTimeRemaining(endTime: Date): string {
  const totalSeconds = Math.floor((endTime.getTime() - Date.now()) / 1000);
  
  if (totalSeconds <= 0) return "Ended";
  
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else {
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}
