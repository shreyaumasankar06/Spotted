import React from 'react';
import { Radio, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { SimulationRunResponse } from '../services/api';

interface LiveStatusBarProps {
  simulation?: SimulationRunResponse | null;
  totalNodes: number;
  containedCount: number;
  antidoteCount?: number;
}

export const LiveStatusBar: React.FC<LiveStatusBarProps> = ({
  simulation,
  totalNodes,
  containedCount,
  antidoteCount = 0,
}) => {
  const activeCount = simulation ? simulation.final_reach : 1;
  const reachPercentage = totalNodes > 0 ? ((activeCount / totalNodes) * 100).toFixed(1) : '0.0';

  return (
    <div className="absolute top-4 left-4 sm:left-6 z-20 glass-panel px-4 py-2.5 rounded-2xl border border-[#A855F7]/20 shadow-2xl flex items-center space-x-4 max-w-2xl">
      {/* Active Spreading */}
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-[#FF365E]/15 border border-[#FF365E]/30 flex items-center justify-center">
          <Radio className="w-3.5 h-3.5 text-[#FF365E] animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] text-[#B7A9C9] font-medium block uppercase tracking-wider">
            Infected Reach
          </span>
          <span className="text-sm font-bold text-[#F8F3FF] font-mono">
            {activeCount} <span className="text-[11px] text-[#FF365E] font-normal">({reachPercentage}%)</span>
          </span>
        </div>
      </div>

      <div className="w-[1px] h-6 bg-[#261A33]" />

      {/* Contained Nodes */}
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-[#39F5A5]/15 border border-[#39F5A5]/30 flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#39F5A5]" />
        </div>
        <div>
          <span className="text-[10px] text-[#B7A9C9] font-medium block uppercase tracking-wider">
            Contained Nodes
          </span>
          <span className="text-sm font-bold text-[#39F5A5] font-mono">
            {containedCount} <span className="text-[11px] text-[#B7A9C9] font-normal">guarded</span>
          </span>
        </div>
      </div>

      {/* Antidote Aware Nodes */}
      {antidoteCount > 0 && (
        <>
          <div className="w-[1px] h-6 bg-[#261A33]" />
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#39F5A5]/15 border border-[#39F5A5]/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#39F5A5]" />
            </div>
            <div>
              <span className="text-[10px] text-[#B7A9C9] font-medium block uppercase tracking-wider">
                Antidote Aware
              </span>
              <span className="text-sm font-bold text-[#39F5A5] font-mono">
                {antidoteCount} <span className="text-[11px] text-[#B7A9C9] font-normal">users</span>
              </span>
            </div>
          </div>
        </>
      )}

      <div className="w-[1px] h-6 bg-[#261A33] hidden sm:block" />

      {/* Network Scale */}
      <div className="hidden sm:flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-[#A855F7]" />
        </div>
        <div>
          <span className="text-[10px] text-[#B7A9C9] font-medium block uppercase tracking-wider">
            Total Scale
          </span>
          <span className="text-sm font-bold text-[#F8F3FF] font-mono">
            {totalNodes} <span className="text-[11px] text-[#B7A9C9] font-normal">users</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveStatusBar;
