import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { SpreadStep } from '../services/api';

interface SpreadChartProps {
  spreadHistory?: SpreadStep[];
}

export const SpreadChart: React.FC<SpreadChartProps> = ({ spreadHistory = [] }) => {
  if (!spreadHistory || spreadHistory.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-[280px] flex flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-[#B7A9C9]">No propagation history available</p>
        <p className="text-xs text-[#756B80] mt-1">
          Click &ldquo;Simulate Rumour Spread&rdquo; or run a benchmark to plot progression over time.
        </p>
      </div>
    );
  }

  const chartData = spreadHistory.map((step) => ({
    step: `T+${step.step}`,
    active: step.active_count,
    contained: step.contained_count,
    unaware: step.unaware_count,
  }));

  return (
    <div className="glass-panel p-5 rounded-2xl h-[300px] flex flex-col space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-[#261A33]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F8F3FF]">
          Propagation Timeline over Time Steps
        </h3>
        <span className="text-[11px] text-[#A855F7] font-mono font-medium">
          {spreadHistory.length} Time Steps
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF365E" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FF365E" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="containedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#39F5A5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#39F5A5" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="unawareGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#756B80" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#756B80" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#261A33" vertical={false} />
            <XAxis
              dataKey="step"
              stroke="#756B80"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#261A33' }}
            />
            <YAxis
              stroke="#756B80"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#261A33' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#120D18',
                borderColor: '#261A33',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#F8F3FF',
              }}
              itemStyle={{ color: '#F8F3FF' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="active"
              name="Active Spreaders"
              stroke="#FF365E"
              fillOpacity={1}
              fill="url(#activeGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="contained"
              name="Contained Nodes"
              stroke="#39F5A5"
              fillOpacity={1}
              fill="url(#containedGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="unaware"
              name="Unaware Users"
              stroke="#756B80"
              fillOpacity={1}
              fill="url(#unawareGrad)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpreadChart;
