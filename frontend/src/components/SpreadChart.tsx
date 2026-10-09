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
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl h-[300px] flex flex-col items-center justify-center text-center">
        <p className="text-sm text-slate-400">No simulation data available yet</p>
        <p className="text-xs text-slate-600 mt-1">
          Click &ldquo;Simulate Single Spread&rdquo; or run a benchmark to plot rumour progression
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
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl h-[300px] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <h3 className="text-sm font-semibold text-slate-200">
          Propagation Timeline Over Discrete Steps
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {spreadHistory.length} Time Steps
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="containedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="unawareGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#64748B" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="step"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              itemStyle={{ color: '#F8FAFC' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="active"
              name="Active Spreaders"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#activeGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="contained"
              name="Contained (Guarded)"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#containedGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="unaware"
              name="Unaware Users"
              stroke="#64748B"
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
