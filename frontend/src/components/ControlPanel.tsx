import React, { useState } from 'react';
import {
  Sliders,
  Play,
  BarChart2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  HelpCircle,
} from 'lucide-react';

interface ControlPanelProps {
  numUsers: number;
  setNumUsers: (v: number) => void;
  probability: number;
  setProbability: (v: number) => void;
  budget: number;
  setBudget: (v: number) => void;
  source: number;
  setSource: (v: number) => void;
  numRuns: number;
  setNumRuns: (v: number) => void;
  seed: number | undefined;
  setSeed: (v: number | undefined) => void;
  availableNodes: number[];
  onGenerateNetwork: () => void;
  onRunSimulation: () => void;
  onCompareStrategies: () => void;
  isGenerating: boolean;
  isSimulating: boolean;
  isComparing: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  numUsers,
  setNumUsers,
  probability,
  setProbability,
  budget,
  setBudget,
  source,
  setSource,
  numRuns,
  setNumRuns,
  seed,
  setSeed,
  availableNodes,
  onGenerateNetwork,
  onRunSimulation,
  onCompareStrategies,
  isGenerating,
  isSimulating,
  isComparing,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [networkModel, setNetworkModel] = useState<string>('community');

  return (
    <div className="w-80 sm:w-96 glass-panel rounded-2xl border border-[#A855F7]/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300">
      {/* Panel Header */}
      <div
        className="px-4 py-3 bg-[#1B1223]/90 border-b border-[#261A33] flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5 text-[#A855F7]" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#F8F3FF] tracking-wider uppercase">
              Control Console
            </h2>
            <p className="text-[10px] text-[#B7A9C9]">Graph & Rumour Parameters</p>
          </div>
        </div>

        <button
          type="button"
          className="p-1 rounded-lg hover:bg-[#261A33] text-[#B7A9C9] transition-colors"
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel Content Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 text-xs">
          {/* Main Controls */}
          <div className="space-y-3.5">
            {/* 1. Network Size */}
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <label className="text-[#B7A9C9] font-medium">Network Size (Users)</label>
                <span className="text-[#A855F7] font-mono font-bold bg-[#1B1223] px-2 py-0.5 rounded border border-[#261A33]">
                  {numUsers}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={numUsers}
                onChange={(e) => setNumUsers(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1B1223] rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
              />
            </div>

            {/* 2. Network Topology Model */}
            <div>
              <label className="block text-[11px] text-[#B7A9C9] font-medium mb-1">
                Network Model
              </label>
              <select
                value={networkModel}
                onChange={(e) => setNetworkModel(e.target.value)}
                className="w-full bg-[#1B1223] border border-[#261A33] text-[#F8F3FF] text-xs rounded-xl px-3 py-1.5 focus:border-[#A855F7] focus:outline-none"
              >
                <option value="community">Synthetic Modular (Community Bridge)</option>
                <option value="smallworld">Watts-Strogatz Small World</option>
                <option value="scalefree">Barabási-Albert Scale Free</option>
              </select>
            </div>

            {/* 3. Transmission Probability */}
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <label className="text-[#B7A9C9] font-medium">Spreading Probability (p)</label>
                <span className="text-[#FF3CAC] font-mono font-bold bg-[#1B1223] px-2 py-0.5 rounded border border-[#261A33]">
                  {(probability * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.05}
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1B1223] rounded-lg appearance-none cursor-pointer accent-[#FF3CAC]"
              />
            </div>

            {/* 4. Intervention Budget */}
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <label className="text-[#B7A9C9] font-medium">Intervention Budget (k)</label>
                <span className="text-[#39F5A5] font-mono font-bold bg-[#1B1223] px-2 py-0.5 rounded border border-[#261A33]">
                  {budget} max
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.min(15, Math.max(1, numUsers - 1))}
                step={1}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1B1223] rounded-lg appearance-none cursor-pointer accent-[#39F5A5]"
              />
            </div>

            {/* 5. Source Node & Benchmark Runs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#B7A9C9] font-medium mb-1">
                  Rumour Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(Number(e.target.value))}
                  className="w-full bg-[#1B1223] border border-[#261A33] text-[#F8F3FF] text-xs rounded-xl px-2.5 py-1.5 focus:border-[#A855F7] focus:outline-none"
                >
                  {availableNodes.length > 0 ? (
                    availableNodes.map((n) => (
                      <option key={n} value={n}>
                        User {n}
                      </option>
                    ))
                  ) : (
                    <option value={0}>User 0</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#B7A9C9] font-medium mb-1">
                  Trials / Strategy
                </label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={numRuns}
                  onChange={(e) => setNumRuns(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#1B1223] border border-[#261A33] text-[#F8F3FF] text-xs rounded-xl px-2.5 py-1.5 focus:border-[#A855F7] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Advanced Collapsible Settings */}
          <div className="pt-1 border-t border-[#261A33]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-[#B7A9C9] hover:text-[#F8F3FF] flex items-center justify-between w-full py-1 font-medium transition-colors"
            >
              <span className="flex items-center space-x-1">
                <HelpCircle className="w-3 h-3 text-[#A855F7]" />
                <span>Reproducibility & Seed</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-[10px] text-[#B7A9C9] mb-1">
                    Random Seed (Reproducibility)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 42"
                    value={seed ?? ''}
                    onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-[#1B1223] border border-[#261A33] text-[#F8F3FF] text-xs rounded-xl px-2.5 py-1.5 focus:border-[#A855F7] focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-[#756B80] mt-1.5 leading-relaxed">
                    <strong className="text-[#A855F7]">Reproducibility Guarantee:</strong> The same seed, topology, and simulation settings reproduce identical rumour spread trajectories. Changing the seed alters stochastic spreading draws without changing node layout or attributes.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={onGenerateNetwork}
              disabled={isGenerating || isSimulating || isComparing}
              className="w-full py-2 px-3 rounded-xl font-medium text-xs bg-[#1B1223] hover:bg-[#261A33] text-[#F8F3FF] border border-[#A855F7]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A855F7]" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-[#A855F7]" />
              )}
              <span>{isGenerating ? 'Generating Graph...' : 'Re-Generate Topology'}</span>
            </button>

            <button
              onClick={onRunSimulation}
              disabled={isGenerating || isSimulating || isComparing}
              className="w-full py-2.5 px-3 rounded-xl font-medium text-xs bg-gradient-to-r from-[#FF365E] to-[#FF3CAC] hover:opacity-90 text-white shadow-[0_0_20px_rgba(255,54,94,0.35)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isSimulating ? 'Propagating Rumour...' : 'Simulate Rumour Spread'}</span>
            </button>

            <button
              onClick={onCompareStrategies}
              disabled={isGenerating || isSimulating || isComparing}
              className="w-full py-2.5 px-3 rounded-xl font-medium text-xs bg-[#120D18] hover:bg-[#1B1223] text-[#39F5A5] border border-[#39F5A5]/40 shadow-[0_0_15px_rgba(57,245,165,0.15)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isComparing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#39F5A5]" />
              ) : (
                <BarChart2 className="w-3.5 h-3.5 text-[#39F5A5]" />
              )}
              <span>{isComparing ? 'Evaluating Strategies...' : 'Benchmark All Strategies'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
