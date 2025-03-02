/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FundPerformanceChart } from './FundPerformanceChart';
import { LineChart, Info, BarChart3, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getFundBalances, TokenBalance } from '@/app/utils/covalent';

// Configuration constants
const CHAIN_ID = 'eth-sepolia'; // Sepolia testnet
const POLLING_INTERVAL = 30000; // 30 seconds

// Default colors for tokens
const TOKEN_COLORS: { [key: string]: string } = {
  'USDCx': '#2775CA',
  'DAIx': '#F5AC37',
  'ETHx': '#627EEA',
  'MATICx': '#8247E5',
  'WETH': '#627EEA',
  'USDC': '#2775CA',
  'DAI': '#F5AC37',
  'SEPx': '#00FF00',
  'MATIC': '#8247E5',
  'FFSampleFund': '#6A78FF',
  'SEP': '#62AEEA',
  'WBTC': '#F7931A',
  'ARB': '#28A0F0',
};

// Add default prices for our tokens
const DEFAULT_TOKEN_PRICES: { [key: string]: number } = {
  'fUSDCx': 1.00,
  'fDAIx': 1.01,
  'fUSDC': 1.00,
  'ETH': 2500.00,
  'DAIx': 1.01,
  'USDCx': 1.00,
  'USDC': 1.00,
  'DAI': 1.01
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
}

// Helper function to format address for display
const formatAddress = (address?: string): string => {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to create test portfolio when needed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createTestPortfolio = (): Asset[] => {
  console.log("📊 Using test portfolio data (no real data available)");
  return [
    {
      id: '1',
      name: 'USD Coin Super',
      symbol: 'USDCx',
      price: 1.00,
      allocation: 30,
      value: 300,
      color: TOKEN_COLORS['USDCx'],
      change: 0.01,
      balance: 300,
      isDemo: false
    },
    {
      id: '2',
      name: 'DAI Super',
      symbol: 'DAIx',
      price: 1.01,
      allocation: 20,
      value: 200,
      color: TOKEN_COLORS['DAIx'],
      change: 0.35,
      balance: 198.02,
      isDemo: false
    },
    {
      id: '3',
      name: 'Fluid Funds Sample',
      symbol: 'FFSampleFund',
      price: 0.001,
      allocation: 10,
      value: 100,
      color: TOKEN_COLORS['FFSampleFund'],
      change: 1.25,
      balance: 100000,
      isDemo: false
    },
    {
      id: '4',
      name: 'USD Coin',
      symbol: 'fUSDC',
      price: 1.00,
      allocation: 10,
      value: 100,
      color: TOKEN_COLORS['USDC'],
      change: 0.02,
      balance: 100,
      isDemo: false
    },
  ];
};

export const PerformanceHistory = ({ tvl, percentageChange, fundAddress }: PerformanceHistoryProps) => {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dataSource, setDataSource] = useState<'api' | 'test'>('test');
  
  // Track if component is mounted to prevent state updates after unmount
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMounted = useRef(true);
  
  // Store the current fund address to prevent race conditions
  const currentFundAddress = useRef<string | undefined>(fundAddress);

  // Log the fund address we're working with
  useEffect(() => {
    if (fundAddress) {
      console.log(`🔍 PerformanceHistory mounted with fund address: ${fundAddress}`);
    } else {
      console.warn('⚠️ PerformanceHistory mounted without a fund address');
    }
    
    // Verify API key on mount
    const isApiKeyValid = verifyApiKey();
    if (!isApiKeyValid) {
      setError("Invalid or missing Covalent API key. Check .env.local file.");
    }
    
    // Update the ref when fundAddress changes
    currentFundAddress.current = fundAddress;
    
    // Reset state when fund address changes
    setAssets([]);
    setIsLoading(true);
    setError(null);
  }, [fundAddress]);

  // Process token balances into assets
  const processTokenBalances = useCallback((tokenBalances: TokenBalance[]): Asset[] => {
    if (!tokenBalances || tokenBalances.length === 0) {
      return [];
    }

    console.log(`📋 Processing ${tokenBalances.length} tokens from Covalent API`);

    // Log all tokens including dust for debugging
    const processedTokens = tokenBalances.map(t => {
      const balance = parseFloat(t.balance) / Math.pow(10, t.contract_decimals);
      const price = t.quote_rate || DEFAULT_TOKEN_PRICES[t.contract_ticker_symbol] || 0;
      return {
        symbol: t.contract_ticker_symbol,
        name: t.contract_name,
        balance,
        price,
        value: balance * price
      };
    });

    console.log("All tokens from API (including dust):", processedTokens);

    // Find USDCx token data for average price calculations
    const usdcxToken = tokenBalances.find(token => 
      token.contract_ticker_symbol === 'USDCx' || 
      token.contract_ticker_symbol === 'fUSDCx'
    );
    
    const usdcxBalance = usdcxToken 
      ? parseFloat(usdcxToken.balance) / Math.pow(10, usdcxToken.contract_decimals)
      : 0;

    console.log('USDCx balance for avg price calculation:', usdcxBalance);

    // Filter out invalid tokens and those with zero balance
    const validTokens = tokenBalances.filter(token => {
      const balance = parseFloat(token.balance) / Math.pow(10, token.contract_decimals);
      return balance > 0.000001; // Only filter by balance
    });

    // Calculate total portfolio value
    const portfolioValue = validTokens.reduce((sum, token) => {
      const balance = parseFloat(token.balance) / Math.pow(10, token.contract_decimals);
      const price = token.quote_rate || DEFAULT_TOKEN_PRICES[token.contract_ticker_symbol] || 0;
      return sum + (balance * price);
    }, 0);

    console.log(`💰 Total portfolio value from Covalent: $${portfolioValue.toFixed(2)}`);

    // Map token balances to Asset format
    const portfolioAssets = validTokens.map(token => {
      const symbol = token.contract_ticker_symbol || 'Unknown';
      const name = token.contract_name || symbol;
      const balance = parseFloat(token.balance) / Math.pow(10, token.contract_decimals);
      const price = token.quote_rate || DEFAULT_TOKEN_PRICES[symbol] || 0;
      const value = balance * price;
      const allocation = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;
      
      // Calculate average purchase price (USDCx spent / token units)
      const avgPurchasePrice = balance > 0 ? usdcxBalance / balance : price;
      
      // Use TOKEN_COLORS if available, otherwise generate a color
      const color = TOKEN_COLORS[symbol] || `hsl(${Math.abs(symbol.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360}, 70%, 50%)`;
      
      // Calculate price change percentage
      const priceChange = avgPurchasePrice > 0 
        ? ((price - avgPurchasePrice) / avgPurchasePrice) * 100 
        : 0;

      return {
        id: token.contract_address,
        name,
        symbol,
        price,
        avgPurchasePrice,
        usdcxSpent: usdcxBalance, // Amount of USDCx spent
        balance,
        value,
        allocation,
        color,
        change: priceChange,
        isDemo: false
      };
    });

    console.log('Processed portfolio assets:', portfolioAssets);
    return portfolioAssets.sort((a, b) => b.value - a.value);
  }, []);

  // Fetch portfolio data using Covalent API
  useEffect(() => {
    if (!fundAddress) {
      setError("No fund address provided");
      setIsLoading(false);
      return;
    }

    const fetchPortfolioData = async () => {
      try {
        console.log(`🚀 Fetching portfolio data for: ${fundAddress}`);
        
        if (!verifyApiKey()) {
          throw new Error("Invalid or missing Covalent API key");
        }
        
        const tokenBalances = await getFundBalances(fundAddress, CHAIN_ID);
        console.log(`✅ Received ${tokenBalances.length} tokens from Covalent API`);
        
        if (!tokenBalances || tokenBalances.length === 0) {
          setAssets([]); // Set empty array instead of error
          setError(null);
          setIsLoading(false);
          return;
        }
        
        const portfolioAssets = processTokenBalances(tokenBalances);
        console.log('Setting portfolio assets:', portfolioAssets);
        setAssets(portfolioAssets);
        setError(null);
        
      } catch (error: any) {
        console.error('❌ Error fetching portfolio data:', error);
        setError(`Failed to load data: ${error.message}`);
        setAssets([]); // Clear assets on error
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchPortfolioData();
    
    // Set up polling interval
    const intervalId = setInterval(fetchPortfolioData, POLLING_INTERVAL);
    
    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [fundAddress, processTokenBalances]);

  // Portfolio data for pie chart
  const portfolioData = useMemo(() => {
    return assets.map(asset => ({
      name: asset.symbol,
      symbol: asset.symbol,
      value: asset.allocation,
      color: asset.color
    }));
  }, [assets]);

  const chartVariants = {
    initial: { 
      opacity: 0,
      y: 20
    },
    animate: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const tableVariants = {
    initial: { 
      opacity: 0,
      x: 20
    },
    animate: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
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
      return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    }
    return null;
  };

  // If there's an error, display it
  if (error) {
  return (
      <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="flex border-b border-white/[0.08]">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center gap-2 py-4 px-6 transition-colors border-b-2 border-fluid-primary text-white"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Portfolio</span>
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className="flex items-center gap-2 py-4 px-6 transition-colors text-white/60 hover:text-white"
          >
            <LineChart className="w-4 h-4" />
            <span>Performance</span>
          </button>
        </div>
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-500/10 rounded-full p-3 mb-4">
              <Info className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-400 mb-2">Error loading portfolio data</p>
            <p className="text-white/60 max-w-md">{error}</p>
            {fundAddress && (
              <p className="text-white/60 mt-2">Fund address: {formatAddress(fundAddress)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && assets.length === 0) {
    return (
      <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="flex border-b border-white/[0.08]">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center gap-2 py-4 px-6 transition-colors border-b-2 border-fluid-primary text-white"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Portfolio</span>
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className="flex items-center gap-2 py-4 px-6 transition-colors text-white/60 hover:text-white"
          >
            <LineChart className="w-4 h-4" />
            <span>Performance</span>
          </button>
        </div>
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fluid-primary mb-4"></div>
            <p className="text-white/60">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Missing fund address warning */}
      {!fundAddress && (
        <div className="bg-red-500/20 py-2 px-4 text-red-300 text-sm border-b border-red-800/20">
          <strong>⚠️ Missing Fund Address!</strong> This component requires a fund address to fetch real data.
          <div className="mt-1 text-xs">
            In your Fund Detail page, make sure to pass the fund&apos;s address as a prop:
            <pre className="mt-1 bg-black/20 p-2 rounded overflow-x-auto">
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
          className={`flex items-center gap-2 py-4 px-6 transition-colors ${
            activeTab === 'portfolio' 
              ? 'border-b-2 border-fluid-primary text-white' 
              : 'text-white/60 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Portfolio</span>
        </button>
        <button 
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 py-4 px-6 transition-colors ${
            activeTab === 'performance' 
              ? 'border-b-2 border-fluid-primary text-white' 
              : 'text-white/60 hover:text-white'
          }`}
        >
          <LineChart className="w-4 h-4" />
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
          <div className="flex items-center gap-3 p-6 border-b border-white/[0.08]">
            <div className="p-3 rounded-xl bg-white/[0.05]">
              <LineChart className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h3 className="font-medium text-white">Performance History</h3>
              <p className="text-sm text-white/60">Track the funds historical performance</p>
            </div>
          </div>

            {/* Chart Content */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-white/60">Total Value Locked</p>
                <p className="text-2xl font-bold text-white">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(tvl)}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                percentageChange >= 0 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2 mb-6">
              {(['1M', '3M', '1Y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors
                    ${timeRange === range 
                      ? 'bg-fluid-primary text-white' 
                      : 'bg-white/5 text-white/60 hover:text-white'}`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="h-[300px]">
              <FundPerformanceChart tvl={tvl} percentageChange={percentageChange} />
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/[0.05]">
                <BarChart3 className="w-5 h-5 text-white/70" />
              </div>
              <div>
                  <h3 className="font-medium text-white">
                    Portfolio Allocation
                    {fundAddress && (
                      <span className="text-xs text-white/60 ml-2">
                        {formatAddress(fundAddress)}
                      </span>
                    )}
                  </h3>
                <p className="text-sm text-white/60">Current asset distribution</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search assets" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white/80 pl-9 pr-4 py-2 rounded-lg w-full md:w-40 focus:outline-none focus:ring-1 focus:ring-fluid-primary"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
              <motion.div 
                variants={chartVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white/[0.03] rounded-lg p-4"
              >
              <h4 className="text-white font-medium mb-4">Asset Distribution</h4>
                <div className="h-[250px] flex items-center justify-center">
                  <ResponsiveContainer>
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
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            strokeWidth={0}
                          />
                      ))}
                    </Pie>
                    <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            const value = typeof payload[0].value === 'number' 
                              ? payload[0].value.toFixed(2) 
                              : '0.00';
                            return (
                              <div className="bg-[#1F2937] px-3 py-2 rounded-lg border border-white/10">
                                <p className="text-white text-sm">{payload[0].payload.name}</p>
                                <p className="text-white text-sm font-medium">
                                  {`${value}%`}
                                </p>
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
                           
                          <ul className="flex flex-wrap justify-center gap-4 mt-4">
                            {payload?.map((entry: any, index: number) => (
                              <li key={`legend-${index}`} className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-white text-xs">
                                  {entry.value}
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
              <h4 className="text-white font-medium mb-4">Your Positions</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-white/60 text-sm border-b border-white/10">
                      <th onClick={() => requestSort('name')} className="px-4 py-3 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                          Name
                          {getSortIcon('name')}
                        </div>
                      </th>
                        <th className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-1">
                          Avg Price
                        </div>
                      </th>
                      <th onClick={() => requestSort('change')} className="px-4 py-3 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                          Profit/Loss
                          {getSortIcon('change')}
                        </div>
                      </th>
                      <th onClick={() => requestSort('allocation')} className="px-4 py-3 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                          Allocation
                          {getSortIcon('allocation')}
                        </div>
                      </th>
                      <th onClick={() => requestSort('value')} className="px-4 py-3 font-medium text-right cursor-pointer">
                        <div className="flex items-center justify-end gap-1">
                          Total
                          {getSortIcon('value')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                      {sortedAssets.length > 0 ? (
                        sortedAssets.map((asset) => (
                      <tr 
                        key={asset.id} 
                        className="border-b border-white/5 text-white hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: asset.color }}>
                              {asset.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              <div className="text-sm text-white/60">{asset.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                              {asset.avgPurchasePrice !== undefined ? 
                                new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                                  minimumFractionDigits: asset.avgPurchasePrice < 1 ? 4 : 2,
                                }).format(asset.avgPurchasePrice) : 
                                "N/A"}
                              {asset.usdcxSpent !== undefined && asset.balance > 0 ? 
                                <div className="text-xs text-white/50 mt-1">
                                  {(asset.usdcxSpent / asset.balance).toFixed(6)} USDCx/token
                                </div> : 
                                null}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1 ${
                            asset.change >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}>
                            {asset.change >= 0 ? 
                              <ArrowUp className="w-3.5 h-3.5" /> : 
                              <ArrowDown className="w-3.5 h-3.5" />
                            }
                            {Math.abs(asset.change).toFixed(2)}%
                          </div>
                              {asset.avgPurchasePrice !== undefined && (
                                <div className={`text-xs mt-1 ${
                                  asset.price > asset.avgPurchasePrice
                                    ? 'text-green-400'
                                    : asset.price < asset.avgPurchasePrice
                                    ? 'text-red-400'
                                    : 'text-white/50'
                                }`}>
                                  {asset.price > asset.avgPurchasePrice ? '+' : ''}
                                  {((asset.price - asset.avgPurchasePrice) / asset.avgPurchasePrice * 100).toFixed(2)}% from avg
                                </div>
                              )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/10 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ 
                                width: `${asset.allocation}%`,
                                backgroundColor: asset.color
                              }}></div>
                            </div>
                                <span>{asset.allocation.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(asset.value)}
                              {asset.balance > 0 && (
                                <div className="text-xs text-white/50 mt-1">
                                  {asset.balance.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens
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