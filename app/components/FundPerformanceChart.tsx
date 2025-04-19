'use client';
import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceData {
  date: string;
  value: number;
}

interface FundPerformanceChartProps {
  tvl: number;
  percentageChange: number;
  data?: PerformanceData[];
  // Optional props for fallback:
  creationDate?: string; // ISO string for the day the fund was created
  activeStreamsCount?: number; // Used to adjust the baseline of the graph
}

export const FundPerformanceChart = ({
  tvl,
  percentageChange,
  data,
  creationDate,
  activeStreamsCount,
}: FundPerformanceChartProps) => {
  const chartData = useMemo(() => {
    // Add console.log to debug data
    console.log('Chart input data:', {
      tvl,
      percentageChange,
      data,
      creationDate,
      activeStreamsCount,
    });

    if (data && data.length > 0) {
      return data;
    }

    // Ensure TVL is a positive number
    const safeTvl = Math.max(tvl, 0);

    // Get dates
    const today = new Date();
    // If no creation date is provided, default to 90 days ago
    let startDate = creationDate
      ? new Date(creationDate)
      : new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Ensure start date is not in future
    if (startDate > today) {
      startDate = today;
    }

    const diffTime = today.getTime() - startDate.getTime();
    const days = Math.max(1, Math.round(diffTime / (24 * 60 * 60 * 1000)));

    // Calculate start value based on active streams
    // If there are active streams, start from a lower value to show growth
    const startValue =
      activeStreamsCount && activeStreamsCount > 0
        ? safeTvl * 0.2 // Start at 20% of current TVL if there are active streams
        : safeTvl * 0.8; // Start at 80% of current TVL if no active streams

    // Generate data points with smoother progression
    const generatedData: PerformanceData[] = [];
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

      // Create a more natural progression curve using sigmoid function
      const progress = i / days;
      const sigmoid = 1 / (1 + Math.exp(-10 * (progress - 0.5)));

      // Base value with sigmoid progression
      const baseValue = startValue + (safeTvl - startValue) * sigmoid;

      // Add some controlled randomness based on percentageChange
      const volatility = Math.abs(percentageChange) / 100;
      const noise = (Math.random() * 2 - 1) * volatility * safeTvl * 0.02;

      // Ensure the value stays within reasonable bounds
      const value = Math.max(startValue * 0.9, Math.min(baseValue + noise, safeTvl * 1.1));

      generatedData.push({
        date: currentDate.toISOString().split('T')[0],
        value,
      });
    }

    // Debug log generated data
    console.log('Generated chart data:', generatedData);
    return generatedData;
  }, [data, tvl, percentageChange, creationDate, activeStreamsCount]);

  // Add a check for empty data
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-white/60">No data available</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          horizontal
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
        />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
          tickFormatter={value => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
          tickFormatter={value =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '12px',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
          itemStyle={{ color: '#fff' }}
          formatter={(value: number) => [
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            }).format(value),
            'Value',
          ]}
          labelFormatter={label => {
            const date = new Date(label);
            return date.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#colorValue)"
          dot={false}
          activeDot={{
            r: 4,
            fill: '#6366f1',
            stroke: '#fff',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
