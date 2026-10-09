import React from 'react';
import { Shield, TrendingDown, Clock, Activity } from 'lucide-react';
import { SimulationRunResponse, StrategyMetrics } from '../services/api';

interface MetricsCardsProps {
  simulation?: SimulationRunResponse | null;
  bestMetrics?: StrategyMetrics | null;
  baselineReach?: number | null;
  totalNodes: number;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  simulation,
  bestMetrics,
  baselineReach,
  totalNodes,
}) => {
  const reductionPct = bestMetrics ? bestMetrics.reduction_percentage : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* 1. Final Reach Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-lg flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium block">
            {bestMetrics ? 'Best Avg Reach' : 'Current Reach'}
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white font-mono">
              {bestMetrics
                ? bestMetrics.average_final_reach.toFixed(1)
                : simulation
                ? `${simulation.final_reach}`
                : '--'}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {totalNodes} users</span>
          </div>
        </div>
      </div>

      {/* 2. Spread Reduction Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-lg flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium block">Containment Reduction</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {bestMetrics ? `${reductionPct.toFixed(1)}%` : '--'}
            </span>
            {baselineReach && (
              <span className="text-xs text-slate-500">vs {baselineReach.toFixed(1)} base</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Contained Firewall Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-lg flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium block">Interventions Applied</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white font-mono">
              {bestMetrics
                ? bestMetrics.intervention_count
                : simulation
                ? simulation.interventions.length
                : '--'}
            </span>
            <span className="text-xs text-slate-500">nodes guarded</span>
          </div>
        </div>
      </div>

      {/* 4. Speed / Execution Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-lg flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium block">
            {bestMetrics ? 'Optimization Time' : 'Simulation Steps'}
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white font-mono">
              {bestMetrics
                ? `${(bestMetrics.execution_time * 1000).toFixed(0)} ms`
                : simulation
                ? `${simulation.steps_taken} steps`
                : '--'}
            </span>
            {bestMetrics && (
              <span className="text-xs text-slate-500">±{bestMetrics.standard_deviation} σ</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
