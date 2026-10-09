import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { InterventionCompareResponse, StrategyMetrics } from '../services/api';
import { Award, CheckCircle2 } from 'lucide-react';

interface StrategyComparisonProps {
  comparisonData?: InterventionCompareResponse | null;
  selectedStrategyKey?: string;
  onSelectStrategy?: (strategyKey: string, metrics: StrategyMetrics) => void;
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  comparisonData,
  selectedStrategyKey,
  onSelectStrategy,
}) => {
  if (!comparisonData) {
    return (
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
        <h3 className="text-sm font-semibold text-slate-300">
          Strategy Benchmark Comparison
        </h3>
        <p className="text-xs text-slate-500 mt-2">
          Run &ldquo;Benchmark All Strategies&rdquo; to test Random, Highest-Degree, and Greedy
          interventions against baseline.
        </p>
      </div>
    );
  }

  const { strategies, best_strategy, summary, num_runs } = comparisonData;

  const barData = Object.entries(strategies).map(([key, item]) => ({
    key,
    name: item.strategy_name.replace(' Selection', '').replace(' Optimization', ''),
    reach: item.average_final_reach,
    reduction: item.reduction_percentage,
    isBest: item.strategy_name === best_strategy,
    metrics: item,
  }));

  const getBarColor = (key: string, isBest: boolean) => {
    if (key === 'none') return '#EF4444';
    if (isBest) return '#10B981';
    if (key === 'highest_degree') return '#8B5CF6';
    return '#64748B';
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header and Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-200">
              Strategy Containment Performance
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {num_runs} trials / strategy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{summary}</p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">
            Top Performer: {best_strategy}
          </span>
        </div>
      </div>

      {/* Bar Chart: Final Reach Comparison */}
      <div className="h-[220px] w-full">
        <div className="text-xs font-medium text-slate-400 mb-2">
          Average Final Rumour Reach (Lower is better)
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="name"
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
              formatter={(value: any) => [
                `${Number(value).toFixed(2)} users`,
                'Avg Reach',
              ]}
            />
            <Bar dataKey="reach" radius={[6, 6, 0, 0]}>
              {barData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={getBarColor(entry.key, entry.isBest)}
                  cursor="pointer"
                  onClick={() => onSelectStrategy && onSelectStrategy(entry.key, entry.metrics)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Strategy</th>
              <th className="py-2.5 px-3">Selected Users</th>
              <th className="py-2.5 px-3 text-right">Avg Reach</th>
              <th className="py-2.5 px-3 text-right">Std Dev (σ)</th>
              <th className="py-2.5 px-3 text-right">Reduction (%)</th>
              <th className="py-2.5 px-3 text-right">Compute Time</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {Object.entries(strategies).map(([key, item]) => {
              const isSelected = selectedStrategyKey === key;
              return (
                <tr
                  key={key}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-purple-900/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center space-x-1.5">
                    {item.strategy_name === best_strategy && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                    )}
                    <span>{item.strategy_name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {item.selected_nodes.length > 0
                      ? item.selected_nodes.map((n) => `U${n}`).join(', ')
                      : 'None'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                    {item.average_final_reach.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    ±{item.standard_deviation.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={
                        item.reduction_percentage > 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }
                    >
                      {item.reduction_percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {(item.execution_time * 1000).toFixed(1)} ms
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectStrategy && onSelectStrategy(key, item)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isSelected ? 'Viewing' : 'View on Graph'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
