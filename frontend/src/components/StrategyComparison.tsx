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
import { Award, CheckCircle2, Download } from 'lucide-react';

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
      <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
        <h3 className="text-xs font-semibold text-[#B7A9C9] uppercase tracking-wider">
          Containment Strategy Benchmarks
        </h3>
        <p className="text-xs text-[#756B80]">
          Run &ldquo;Evaluate Strategies&rdquo; in the control panel to benchmark Random, Highest-Degree, and Greedy Optimizations.
        </p>
      </div>
    );
  }

  const { strategies, best_strategy, summary, num_runs, budget } = comparisonData;

  const barData = Object.entries(strategies).map(([key, item]) => ({
    key,
    name: item.strategy_name.replace(' Selection', '').replace(' Optimization', ''),
    reach: item.average_final_reach,
    reduction: item.reduction_percentage,
    isBest: item.strategy_name === best_strategy,
    metrics: item,
  }));

  const getBarColor = (key: string, isBest: boolean) => {
    if (key === 'none') return '#FF365E';
    if (isBest) return '#39F5A5';
    if (key === 'highest_degree') return '#A855F7';
    return '#756B80';
  };

  const handleExportCSV = () => {
    const headers = [
      'Strategy Name',
      'Selected Target Nodes',
      'Average Final Reach',
      'Standard Deviation',
      'Reduction Percentage',
      'Intervention Count',
      'Execution Time (s)'
    ];
    const rows = Object.values(strategies).map((s) => [
      `"${s.strategy_name}"`,
      `"${s.selected_nodes.map((n) => `User #${n}`).join('; ')}"`,
      s.average_final_reach.toFixed(2),
      s.standard_deviation.toFixed(2),
      `${s.reduction_percentage.toFixed(1)}%`,
      s.intervention_count,
      s.execution_time.toFixed(4)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spotted_containment_benchmarks_budget${budget}_runs${num_runs}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      {/* Header, Summary, and CSV Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#261A33] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8F3FF]">
              Containment Performance Benchmarks
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B1223] text-[#A855F7] font-mono border border-[#261A33]">
              {num_runs} trials / strategy · Budget k={budget}
            </span>
          </div>
          <p className="text-xs text-[#B7A9C9] mt-0.5">{summary}</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-[#1B1223] hover:bg-[#261A33] text-[#F8F3FF] border border-[#A855F7]/30 text-xs font-medium transition-all flex items-center space-x-1.5 shadow-md"
            title="Export backend benchmark results to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Export CSV</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-[#39F5A5]/10 border border-[#39F5A5]/30 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(57,245,165,0.1)]">
            <Award className="w-4 h-4 text-[#39F5A5]" />
            <span className="text-xs font-semibold text-[#39F5A5]">
              Optimal: {best_strategy}
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart: Final Reach Comparison */}
      <div className="h-[200px] w-full">
        <div className="text-[11px] font-medium text-[#B7A9C9] mb-1.5">
          Average Final Rumour Reach (Lower is better)
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#261A33" vertical={false} />
            <XAxis
              dataKey="name"
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
            <tr className="border-b border-[#261A33] text-[#B7A9C9] font-medium">
              <th className="py-2.5 px-3">Strategy</th>
              <th className="py-2.5 px-3">Selected Targets</th>
              <th className="py-2.5 px-3 text-right">Avg Reach</th>
              <th className="py-2.5 px-3 text-right">Std Dev (σ)</th>
              <th className="py-2.5 px-3 text-right">Reduction (%)</th>
              <th className="py-2.5 px-3 text-right">Compute Time</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#261A33]/60">
            {Object.entries(strategies).map(([key, item]) => {
              const isSelected = selectedStrategyKey === key;
              return (
                <tr
                  key={key}
                  className={`hover:bg-[#1B1223]/50 transition-colors ${
                    isSelected ? 'bg-[#A855F7]/15' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-[#F8F3FF] flex items-center space-x-1.5">
                    {item.strategy_name === best_strategy && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#39F5A5] inline" />
                    )}
                    <span>{item.strategy_name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#B7A9C9]">
                    {item.selected_nodes.length > 0
                      ? item.selected_nodes.map((n) => `U${n}`).join(', ')
                      : 'None'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#F8F3FF]">
                    {item.average_final_reach.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#B7A9C9]">
                    ±{item.standard_deviation.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={
                        item.reduction_percentage > 0
                          ? 'text-[#39F5A5]'
                          : 'text-[#B7A9C9]'
                      }
                    >
                      {item.reduction_percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#B7A9C9]">
                    {(item.execution_time * 1000).toFixed(1)} ms
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectStrategy && onSelectStrategy(key, item)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-[#A855F7] text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                          : 'bg-[#1B1223] hover:bg-[#261A33] text-[#B7A9C9] border border-[#261A33]'
                      }`}
                    >
                      {isSelected ? 'Viewing' : 'Inspect'}
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

export default StrategyComparison;
