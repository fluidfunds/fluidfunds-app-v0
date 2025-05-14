/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FundPerformanceChart } from './FundPerformanceChart';
import {
  LineChart,
  Info,
  BarChart3,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getFundBalances, TokenBalance } from '@/app/utils/covalent';
import { useTokenAveragePrices } from '@/app/hooks/useTokenAveragePrices';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';

// Configuration constants
const CHAIN_ID = 'eth-sepolia'; // Sepolia testnet
const POLLING_INTERVAL = 30000; // 30 seconds

// Default colors for tokens
const TOKEN_COLORS: { [key: string]: string } = {
  USDCx: '#2775CA',
  BTC: '#F7931A',
  DAIx: '#F5AC37',
  ETH: '#627EEA',
  MATICx: '#8247E5',
  WETH: '#627EEA',
  USDC: '#2775CA',
  DAI: '#F5AC37',
  SEPx: '#00FF00',
  MATIC: '#8247E5',
  FFSampleFund: '#6A78FF',
  SEP: '#62AEEA',
  WBTC: '#F7931A',
  ARB: '#28A0F0',
  '0xbec5068ace31df3b6342450689d030716fdda961': '#F7931A',
  // BTC color for this specific address
};

// Add default prices for our tokens
const DEFAULT_TOKEN_PRICES: { [key: string]: number } = {
  fUSDCx: 1.0,
  fDAIx: 1.01,
  fUSDC: 1.0,
  LTC: 91.9987,
  ETH: 2239.96,
  BTC: 101879.0,
  AAVE: 31.9997,
  DOGE: 0.36996,
};

// Add a helper function to verify API key
const verifyApiKey = () => {
  const covalentKey = process.env.NEXT_PUBLIC_COVALENT_API_KEY;

  if (!covalentKey) {
    console.error('❌ Missing Covalent API key in environment variables');
    return false;
  }

  if (covalentKey === 'your_covalent_api_key_here') {
    console.error('❌ Using placeholder API key. Please replace with your actual Covalent API key');
    return false;
  }

  return true;
};

// Define Asset interface for portfolio display
interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  avgPurchasePrice?: number; // Average purchase price (USDCx spent / token units)
  usdcxSpent?: number; // Amount of USDCx spent to acquire these tokens
  allocation: number;
  value: number;
  color: string;
  change: number;
  balance: number;
  isDemo?: boolean; // Flag to track if we're using demo values
}

interface PerformanceHistoryProps {
  tvl: number;
  percentageChange: number;
  fundAddress?: string; // This should be set by the parent component (Fund Detail page)
  holdings?: Holding[]; // Add holdings from wallet page
}

interface Holding {
  name: string;
  symbol: string;
  amount: number;
  value: number;
  change: number;
}

// Helper function to format address for display
const formatAddress = (address?: string): string => {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const PerformanceHistory = ({
  tvl,
  percentageChange,
  fundAddress,
  holdings = [],
}: PerformanceHistoryProps) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '1Y'>('3M');
  const [activeTab, setActiveTab] = useState<'performance' | 'portfolio'>('portfolio');
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'price' | 'change' | 'allocation' | 'value';
    direction: 'asc' | 'desc';
  }>({ key: 'allocation', direction: 'desc' });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideLowValueAssets, setHideLowValueAssets] = useState(true);
  const currentFundAddress = useRef<string | undefined>(fundAddress);

  // Add this near your other hooks
  const { averagePrices } = useTokenAveragePrices(fundAddress as `0x${string}`);

  // Use the Superfluid hook to get active streams for the given fund address
  const { activeStreams } = useSuperfluid(fundAddress as `0x${string}`);
  const activeStreamsCount = activeStreams.length;

  // Process holdings data into assets
  const processHoldingsData = useCallback(
    (holdingsData: Holding[]): Asset[] => {
      return holdingsData.map(holding => {
        const symbol = holding.symbol;
        const color =
          TOKEN_COLORS[symbol] ||
          `hsl(${Math.abs((symbol || 'Unknown').split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360}, 70%, 50%)`;

        return {
          id: symbol,
          name: holding.name,
          symbol: holding.symbol,
          price: holding.value / holding.amount,
          balance: holding.amount,
          allocation: (holding.value / tvl) * 100,
          value: holding.value,
          color,
          change: holding.change,
          isDemo: false,
        };
      });
    },
    [tvl]
  );

  // Process token balances into assets
  const processTokenBalances = useCallback(
    (tokenBalances: TokenBalance[]): Asset[] => {
      // If we have holdings data, use that instead of processing token balances
      if (holdings.length > 0) {
        return holdings.map(holding => {
          const symbol = holding.symbol;
          const color =
            TOKEN_COLORS[symbol] ||
            `hsl(${Math.abs((symbol || 'Unknown').split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360}, 70%, 50%)`;

          return {
            id: symbol,
            name: holding.name,
            symbol: holding.symbol,
            price: holding.value / holding.amount,
            balance: holding.amount,
            allocation: (holding.value / tvl) * 100,
            value: holding.value,
            color,
            change: holding.change,
            isDemo: false,
          };
        });
      }

      // Existing token balance processing logic
      if (!tokenBalances || tokenBalances.length === 0) {
        return [];
      }

      console.log(`📋 Processing ${tokenBalances.length} tokens from Covalent API`);

      // Log all tokens including dust for debugging
      const processedTokens = tokenBalances.map(t => {
        // Use BigNumber or similar for precise decimal calculations
        const balance = Number(t.balance) / Math.pow(10, t.contract_decimals);
        const price = t.quote_rate || DEFAULT_TOKEN_PRICES[t.contract_ticker_symbol] || 0;

        // Format balance based on token type
        const formattedBalance =
          t.contract_ticker_symbol === 'BTC'
            ? Number(balance.toFixed(8)) // BTC typically uses 8 decimal places
            : balance;

        return {
          symbol: t.contract_ticker_symbol || 'Unknown',
          name: t.contract_name || t.contract_ticker_symbol || 'Unknown',
          balance: formattedBalance,
          price,
          value: formattedBalance * price,
        };
      });

      console.log('All tokens from API (including dust):', processedTokens);

      // Find USDCx token data for average price calculations
      const usdcxToken = tokenBalances.find(
        token =>
          token.contract_ticker_symbol === 'USDCx' || token.contract_ticker_symbol === 'fUSDCx'
      );

      const usdcxBalance = usdcxToken
        ? parseFloat(usdcxToken.balance) / Math.pow(10, usdcxToken.contract_decimals)
        : 0;

      console.log('USDCx balance for avg price calculation:', usdcxBalance);

      const btcToken = tokenBalances.find(token => token.contract_ticker_symbol === 'BTC');
      const btcBalance = btcToken
        ? parseFloat(btcToken.balance) / Math.pow(10, btcToken.contract_decimals)
        : 0;

      console.log('test BTC balance for avg price calculation:', btcBalance);

      // Filter out invalid tokens and those with zero balance
      const validTokens = tokenBalances.filter(token => {
        const balance = parseFloat(token.balance) / Math.pow(10, token.contract_decimals);
        return balance > 0.000001; // Only filter by balance
      });

      // Calculate total portfolio value
      const portfolioValue = validTokens.reduce((sum, token) => {
        const balance = parseFloat(token.balance) / Math.pow(10, token.contract_decimals);
        const price = token.quote_rate || DEFAULT_TOKEN_PRICES[token.contract_ticker_symbol] || 0;
        return sum + balance * price;
      }, 0);

      console.log(`💰 Total portfolio value from Covalent: $${portfolioValue.toFixed(2)}`);

      // Map token balances to Asset format
      const portfolioAssets = validTokens.map(token => {
        let symbol = token.contract_ticker_symbol || 'Unknown';
        let name = token.contract_name || symbol;

        // Manual override for known addresses with missing metadata
        if (token.contract_address.toLowerCase() === '0xbec5068ace31df3b6342450689d030716fdda961') {
          symbol = 'BTC';
          name = 'Test Bitcoin';

          // Log the raw BTC data for debugging
          console.log('Raw BTC token data:', {
            address: token.contract_address,
            rawBalance: token.balance,
            decimals: token.contract_decimals,
            expected: parseFloat(token.balance) / Math.pow(10, 18), // Force 18 decimals
          });
        }

        // Manual override for ETH token
        if (token.contract_address.toLowerCase() === '0xc0341325a034516c4146ef496a768de1850d09f5') {
          symbol = 'ETH';
          name = 'Test Ethereum';

          // Log the raw ETH data for debugging
          console.log('Raw ETH token data:', {
            address: token.contract_address,
            rawBalance: token.balance,
            decimals: token.contract_decimals,
            expected: parseFloat(token.balance) / Math.pow(10, 18), // Force 18 decimals
          });
        }

        // Manual override for LTC token
        if (token.contract_address.toLowerCase() === '0xb2f89cabbaf106d0ca10302d10a6d4b1734d5009') {
          symbol = 'LTC';
          name = 'Test Litecoin';

          // Log the raw LTC data for debugging
          console.log('Raw LTC token data:', {
            address: token.contract_address,
            rawBalance: token.balance,
            decimals: token.contract_decimals,
            expected: parseFloat(token.balance) / Math.pow(10, 18), // Force 18 decimals
          });
        }

        // Manual override for AAVE token
        if (token.contract_address.toLowerCase() === '0x8caa1b86c6aa7b4c8b733515ad1a9a2ecf8a9887') {
          symbol = 'AAVE';
          name = 'Test Aave';

          // Log the raw AAVE data for debugging
          console.log('Raw AAVE token data:', {
            address: token.contract_address,
            rawBalance: token.balance,
            decimals: token.contract_decimals,
            expected: parseFloat(token.balance) / Math.pow(10, 18), // Force 18 decimals
          });
        }

        // Manual override for DOGE token
        if (token.contract_address.toLowerCase() === '0xd3443ddce8a43626fa54f0a3aee81451d4e1a6b3') {
          symbol = 'DOGE';
          name = 'Test Dogecoin';

          // Log the raw DOGE data for debugging
          console.log('Raw DOGE token data:', {
            address: token.contract_address,
            rawBalance: token.balance,
            decimals: token.contract_decimals,
            expected: parseFloat(token.balance) / Math.pow(10, 18), // Force 18 decimals
          });
        }

        // Use the token's decimals, but override to 18 for known tokens if needed
        const cryptoSymbols = ['BTC', 'ETH', 'LTC', 'AAVE', 'DOGE'];
        const decimals = cryptoSymbols.includes(symbol) ? 18 : token.contract_decimals;

        // Calculate balance correctly
        const balance = parseFloat(token.balance) / Math.pow(10, decimals);

        // Rest of your code remains the same
        const price = token.quote_rate || DEFAULT_TOKEN_PRICES[symbol] || 0;
        const value = balance * price;
        const allocation = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;

        // Get average purchase price from trade history if available
        const tokenKey = token.contract_address.toLowerCase();
        const tradeHistoryPrice = averagePrices[tokenKey]?.avgPurchasePrice;

        // Use trade history price if available, otherwise fallback to previous calculation
        const avgPurchasePrice =
          tradeHistoryPrice !== undefined
            ? tradeHistoryPrice
            : balance > 0
              ? usdcxBalance / balance
              : price;

        // Use TOKEN_COLORS if available, otherwise generate a color
        const color =
          TOKEN_COLORS[symbol] ||
          `hsl(${Math.abs((symbol || 'Unknown').split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360}, 70%, 50%)`;

        // Calculate price change percentage based on trade history
        const priceChange =
          avgPurchasePrice > 0 ? ((price - avgPurchasePrice) / avgPurchasePrice) * 100 : 0;

        return {
          id: token.contract_address,
          name,
          symbol,
          price,
          avgPurchasePrice,
          usdcxSpent: averagePrices[tokenKey]?.totalSpent || usdcxBalance, // Use trade data if available
          balance,
          value,
          allocation,
          color,
          change: priceChange,
          isDemo: false,
        };
      });

      console.log('Processed portfolio assets:', portfolioAssets);
      return portfolioAssets.sort((a, b) => b.value - a.value);
    },
    [averagePrices, holdings, tvl]
  );

  // Update assets when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      const processedAssets = processHoldingsData(holdings);
      setAssets(processedAssets);
      setIsLoading(false);
      setError(null);
    }
  }, [holdings, processHoldingsData]);

  // Fetch portfolio data using Covalent API only when no holdings are provided
  useEffect(() => {
    if (!fundAddress || holdings.length > 0) {
      return;
    }

    const fetchPortfolioData = async () => {
      try {
        console.log(`🚀 Fetching portfolio data for: ${fundAddress}`);

        if (!verifyApiKey()) {
          throw new Error('Invalid or missing Covalent API key');
        }

        const tokenBalances = await getFundBalances(fundAddress, CHAIN_ID);
        console.log(`✅ Received ${tokenBalances.length} tokens from Covalent API`);

        if (!tokenBalances || tokenBalances.length === 0) {
          setAssets([]);
          setError(null);
          setIsLoading(false);
          return;
        }

        const portfolioAssets = processTokenBalances(tokenBalances);
        console.log('Setting portfolio assets:', portfolioAssets);

        if (currentFundAddress.current === fundAddress) {
          setAssets(portfolioAssets);
          setError(null);
        }
      } catch (error: any) {
        console.error('❌ Error fetching portfolio data:', error);
        setError(`Failed to load data: ${error.message}`);
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchPortfolioData();

    const intervalId = setInterval(fetchPortfolioData, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fundAddress, holdings.length, processTokenBalances]);

  // Portfolio data for pie chart
  const portfolioData = useMemo(() => {
    // Sort assets by value in descending order
    const sortedAssets = [...assets].sort((a, b) => b.value - a.value);

    // Take top 5 assets
    const topAssets = sortedAssets.slice(0, 5);

    // Calculate "Others" if there are more than 5 assets
    if (sortedAssets.length > 5) {
      const othersValue = sortedAssets.slice(5).reduce((sum, asset) => sum + asset.allocation, 0);

      return [
        ...topAssets.map(asset => ({
          name: asset.symbol,
          symbol: asset.symbol,
          value: asset.allocation,
          color: asset.color,
        })),
        {
          name: 'Others',
          symbol: 'Others',
          value: othersValue,
          color: '#718096', // A neutral gray color for "Others"
        },
      ];
    }

    // If 5 or fewer assets, return all of them
    return sortedAssets.map(asset => ({
      name: asset.symbol,
      symbol: asset.symbol,
      value: asset.allocation,
      color: asset.color,
    }));
  }, [assets]);

  const chartVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const tableVariants = {
    initial: {
      opacity: 0,
      x: 20,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const filteredAssets = assets.filter(
    asset =>
      asset.name !== 'Unknown' &&
      (asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!hideLowValueAssets || asset.value >= 1) // Add filter for low value assets
  );

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    }
  });

  const requestSort = (key: 'name' | 'price' | 'change' | 'allocation' | 'value') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: 'name' | 'price' | 'change' | 'allocation' | 'value') => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      );
    }
    return null;
  };

  // If there's an error, display it
  if (error) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex border-b border-white/[0.08]">
          <button
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center gap-2 border-b-2 border-fluid-primary px-6 py-4 text-white transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Portfolio</span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className="flex items-center gap-2 px-6 py-4 text-white/60 transition-colors hover:text-white"
          >
            <LineChart className="h-4 w-4" />
            <span>Performance</span>
          </button>
        </div>
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-red-500/10 p-3">
              <Info className="h-6 w-6 text-red-400" />
            </div>
            <p className="mb-2 text-red-400">Error loading portfolio data</p>
            <p className="max-w-md text-white/60">{error}</p>
            {fundAddress && (
              <p className="mt-2 text-white/60">Fund address: {formatAddress(fundAddress)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && assets.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex border-b border-white/[0.08]">
          <button
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center gap-2 border-b-2 border-fluid-primary px-6 py-4 text-white transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Portfolio</span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className="flex items-center gap-2 px-6 py-4 text-white/60 transition-colors hover:text-white"
          >
            <LineChart className="h-4 w-4" />
            <span>Performance</span>
          </button>
        </div>
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-fluid-primary"></div>
            <p className="text-white/60">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      {/* Missing fund address warning */}
      {!fundAddress && (
        <div className="border-b border-red-800/20 bg-red-500/20 px-4 py-2 text-sm text-red-300">
          <strong>⚠️ Missing Fund Address!</strong> This component requires a fund address to fetch
          real data.
          <div className="mt-1 text-xs">
            In your Fund Detail page, make sure to pass the fund&apos;s address as a prop:
            <pre className="mt-1 overflow-x-auto rounded bg-black/20 p-2">
              {`<PerformanceHistory
  fundAddress={fundAddress}
  tvl={1000}
  percentageChange={5}
/>`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-white/[0.08]">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-6 py-4 transition-colors ${
            activeTab === 'portfolio'
              ? 'border-b-2 border-fluid-primary text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Portfolio</span>
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-6 py-4 transition-colors ${
            activeTab === 'performance'
              ? 'border-b-2 border-fluid-primary text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <LineChart className="h-4 w-4" />
          <span>Performance</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Performance History Content */}
        {activeTab === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/[0.08] p-6">
              <div className="rounded-xl bg-white/[0.05] p-3">
                <LineChart className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <h3 className="font-medium text-white">Performance History</h3>
                <p className="text-sm text-white/60">Track the funds historical performance</p>
              </div>
            </div>

            {/* Chart Content */}
            <div className="p-6">
              {/* Time Range Selector */}
              <div className="mb-6 flex gap-2">
                {(['1M', '3M', '1Y'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                      timeRange === range
                        ? 'bg-fluid-primary text-white'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="h-[300px]">
                <FundPerformanceChart
                  tvl={tvl}
                  percentageChange={percentageChange}
                  activeStreamsCount={activeStreamsCount}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Portfolio Content */}
        {activeTab === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/[0.05] p-3">
                  <BarChart3 className="h-5 w-5 text-white/70" />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    Portfolio Allocation
                    {fundAddress && (
                      <span className="ml-2 text-xs text-white/60">
                        {formatAddress(fundAddress)}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-white/60">Current asset distribution</p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white/40" />
                  <input
                    type="text"
                    placeholder="Search assets"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-white/80 focus:outline-none focus:ring-1 focus:ring-fluid-primary md:w-40"
                  />
                </div>

                {/* Add toggle for low value assets */}
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={hideLowValueAssets}
                      onChange={e => setHideLowValueAssets(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-fluid-primary peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-fluid-primary/20"></div>
                  </label>
                  <span className="text-sm text-white/60">Hide low value assets (&lt;$1)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Pie Chart */}
              <motion.div
                variants={chartVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="rounded-lg bg-white/[0.03] p-4"
              >
                <h4 className="mb-4 font-medium text-white">Asset Distribution</h4>
                <div className="flex h-[250px] items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        fill="#8884d8"
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            const value =
                              typeof payload[0].value === 'number'
                                ? payload[0].value.toFixed(2)
                                : '0.00';
                            return (
                              <div className="rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2">
                                <p className="text-sm text-white">{payload[0].payload.name}</p>
                                <p className="text-sm font-medium text-white">{`${value}%`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        content={({ payload }) => (
                          <ul className="mt-4 flex flex-wrap justify-center gap-4">
                            {payload?.map((entry: any, index: number) => (
                              <li key={`legend-${index}`} className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs text-white">
                                  {entry.value} ({entry.payload.value.toFixed(1)}%)
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Asset Table */}
              <motion.div
                variants={tableVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="lg:col-span-2"
              >
                <h4 className="mb-4 font-medium text-white">Your Positions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-sm text-white/60">
                        <th
                          onClick={() => requestSort('name')}
                          className="cursor-pointer px-4 py-3 font-medium"
                        >
                          <div className="flex items-center gap-1">
                            Name
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-1">Avg Price</div>
                        </th>
                        <th
                          onClick={() => requestSort('change')}
                          className="cursor-pointer px-4 py-3 font-medium"
                        >
                          <div className="flex items-center gap-1">
                            Profit/Loss
                            {getSortIcon('change')}
                          </div>
                        </th>
                        <th
                          onClick={() => requestSort('allocation')}
                          className="cursor-pointer px-4 py-3 font-medium"
                        >
                          <div className="flex items-center gap-1">
                            Allocation
                            {getSortIcon('allocation')}
                          </div>
                        </th>
                        <th
                          onClick={() => requestSort('value')}
                          className="cursor-pointer px-4 py-3 text-right font-medium"
                        >
                          <div className="flex items-center justify-end gap-1">
                            Total
                            {getSortIcon('value')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAssets.length > 0 ? (
                        sortedAssets.map(asset => (
                          <tr
                            key={asset.id}
                            className="border-b border-white/5 text-white transition-colors hover:bg-white/[0.02]"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                  style={{ backgroundColor: asset.color }}
                                >
                                  {asset.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{asset.name}</div>
                                  <div className="text-sm text-white/60">{asset.symbol}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {asset.avgPurchasePrice !== undefined
                                ? new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: asset.avgPurchasePrice < 1 ? 4 : 2,
                                  }).format(asset.avgPurchasePrice)
                                : 'N/A'}
                              {asset.avgPurchasePrice !== undefined && (
                                <div className="mt-1 text-xs text-white/50">
                                  {asset.usdcxSpent !== undefined && asset.balance > 0
                                    ? `Based on ${asset.usdcxSpent.toFixed(2)} USDCx spent`
                                    : ''}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div
                                className={`flex items-center gap-1 ${
                                  asset.change >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {asset.change >= 0 ? (
                                  <ArrowUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowDown className="h-3.5 w-3.5" />
                                )}
                                {Math.abs(asset.change).toFixed(2)}%
                              </div>
                              {asset.avgPurchasePrice !== undefined && (
                                <div
                                  className={`mt-1 text-xs ${
                                    asset.price > asset.avgPurchasePrice
                                      ? 'text-green-400'
                                      : asset.price < asset.avgPurchasePrice
                                        ? 'text-red-400'
                                        : 'text-white/50'
                                  }`}
                                >
                                  {asset.price > asset.avgPurchasePrice ? '+' : ''}% from avg
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="h-2 w-full rounded-full bg-white/10">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      width: `${asset.allocation}%`,
                                      backgroundColor: asset.color,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-center text-xs text-white/70">
                                  {asset.allocation.toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                              }).format(asset.value)}
                              {asset.balance > 0 && (
                                <div className="mt-1 text-xs text-white/50">
                                  {(() => {
                                    const cryptoSymbols = ['BTC', 'ETH', 'LTC', 'AAVE', 'DOGE'];

                                    if (cryptoSymbols.includes(asset.symbol)) {
                                      return `${asset.balance.toFixed(8)} ${asset.symbol}`;
                                    }

                                    return `${asset.balance.toLocaleString(undefined, {
                                      maximumFractionDigits: asset.balance < 0.01 ? 6 : 4,
                                      minimumFractionDigits: asset.balance < 0.01 ? 6 : 2,
                                    })} ${asset.symbol}`;
                                  })()}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                            No assets found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
