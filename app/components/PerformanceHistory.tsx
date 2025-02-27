'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FundPerformanceChart } from './FundPerformanceChart';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LineChart, Info, BarChart3, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PerformanceHistoryProps {
  tvl: number;
  percentageChange: number;
}

export const PerformanceHistory = ({ tvl, percentageChange }: PerformanceHistoryProps) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '1Y'>('3M');
  const [activeTab, setActiveTab] = useState<'performance' | 'portfolio'>('performance'); // Changed default to performance
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'price' | 'change' | 'allocation' | 'value';
    direction: 'asc' | 'desc';
  }>({ key: 'allocation', direction: 'desc' });

  // Portfolio data for pie chart
  const portfolioData = [
    { name: 'USDC', value: 40, color: '#3B82F6' }, // blue-500
    { name: 'ETH', value: 25, color: '#8B5CF6' },  // purple-500
    { name: 'AAVE', value: 20, color: '#10B981' }, // green-500
    { name: 'BTC', value: 8, color: '#EC4899' },   // pink-500
    { name: 'UNI', value: 7, color: '#FBBF24' },   // yellow-400
  ];

  // Portfolio assets with additional details
  const assets = [
    { id: 1, name: 'USDC', symbol: 'USDC', price: 1.00, allocation: 40, value: 156000, color: '#3B82F6', change: 0.5 },
    { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3200.75, allocation: 25, value: 97500, color: '#8B5CF6', change: 2.7 },
    { id: 3, name: 'Aave', symbol: 'AAVE', price: 97.25, allocation: 20, value: 78000, color: '#10B981', change: 1.3 },
    { id: 4, name: 'Bitcoin', symbol: 'BTC', price: 62451.18, allocation: 8, value: 31200, color: '#EC4899', change: -0.8 },
    { id: 5, name: 'Uniswap', symbol: 'UNI', price: 7.84, allocation: 7, value: 27300, color: '#FBBF24', change: -1.2 },
  ];

  const sortedAssets = [...assets].sort((a, b) => {
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] rounded-xl border border-white/[0.08] overflow-hidden"
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-white/[0.08]">
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
      </div>

      {/* Performance History Content */}
      {activeTab === 'performance' && (
        <>
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

          {/* Chart Content - moved up to replace the Fund Details section */}
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
        </>
      )}

      {/* Portfolio Content */}
      {activeTab === 'portfolio' && (
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/[0.05]">
                <BarChart3 className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h3 className="font-medium text-white">Portfolio Allocation</h3>
                <p className="text-sm text-white/60">Current asset distribution</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search assets" 
                  className="bg-white/5 border border-white/10 text-white/80 pl-9 pr-4 py-2 rounded-lg w-full md:w-40 focus:outline-none focus:ring-1 focus:ring-fluid-primary"
                />
              </div>
              <div className="bg-white/[0.05] px-4 py-2 rounded-lg">
                <div className="text-sm text-white/60">Total Value</div>
                <div className="text-xl font-medium text-white">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(tvl)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <div className="bg-white/[0.03] rounded-lg p-4">
              <h4 className="text-white font-medium mb-4">Asset Distribution</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80} // Reduced from 90 to ensure it fits
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`]}
                      contentStyle={{ backgroundColor: 'rgba(23, 25, 35, 0.9)', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend 
                      layout="horizontal" // Changed from vertical to horizontal
                      align="center" // Changed from right to center
                      verticalAlign="bottom" // Changed from middle to bottom
                      formatter={(value) => <span className="text-white text-xs">{value}</span>}
                      wrapperStyle={{ paddingTop: 10 }}
                      iconSize={8}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Table - CMC Style */}
            <div className="lg:col-span-2">
              <h4 className="text-white font-medium mb-4">Your Assets</h4>
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
                      <th onClick={() => requestSort('price')} className="px-4 py-3 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                          Price
                          {getSortIcon('price')}
                        </div>
                      </th>
                      <th onClick={() => requestSort('change')} className="px-4 py-3 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                          24h %
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
                          Holdings
                          {getSortIcon('value')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssets.map((asset) => (
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
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: asset.price < 1 ? 4 : 2,
                          }).format(asset.price)}
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
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/10 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ 
                                width: `${asset.allocation}%`,
                                backgroundColor: asset.color
                              }}></div>
                            </div>
                            <span>{asset.allocation}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(asset.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};