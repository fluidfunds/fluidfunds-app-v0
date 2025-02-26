'use client';
import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface FundPerformanceChartProps {
  tvl: number;
  percentageChange: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const FundPerformanceChart = ({ tvl, percentageChange }: FundPerformanceChartProps) => {
  const data = useMemo(() => {
    const chartData = [];
    let value = tvl * 0.8; // Start at 80% of current TVL
    const days = 90;
    
    for (let i = 0; i < days; i++) {
      const change = (Math.random() * 4 - 2) / 100;
      value = value * (1 + change);
      
      chartData.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        value: value
      });
    }
    return chartData;
  }, [tvl]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          vertical={false}
          horizontal={true}
          strokeDasharray="3 3" 
          stroke="rgba(255,255,255,0.05)" 
        />
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
          tickFormatter={(value) => 
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(value)
          }
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '12px'
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
          itemStyle={{ color: '#fff' }}
          formatter={(value: number) => [
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2
            }).format(value),
            'Value'
          ]}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
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
            strokeWidth: 2
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};