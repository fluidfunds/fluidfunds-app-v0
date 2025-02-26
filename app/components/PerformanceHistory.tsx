'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FundPerformanceChart } from './FundPerformanceChart';
import { LineChart } from 'lucide-react';

interface PerformanceHistoryProps {
  tvl: number;
  percentageChange: number;
}

export const PerformanceHistory = ({ tvl, percentageChange }: PerformanceHistoryProps) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '1Y'>('3M');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] rounded-xl border border-white/[0.08] overflow-hidden"
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
  );
};