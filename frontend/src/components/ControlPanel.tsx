import React from 'react';
import { Network, Play, BarChart2, Loader2, Sparkles } from 'lucide-react';

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
  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Simulation Controls</span>
        </h2>
        <span className="text-xs text-slate-500 font-mono">Live API Connected</span>
      </div>

      <div className="space-y-4">
        {/* Network Size */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <label className="text-slate-300">Network Size (Users)</label>
            <span className="text-purple-400 font-mono">{numUsers}</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={numUsers}
            onChange={(e) => setNumUsers(Number(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Spreading Probability */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <label className="text-slate-300">Spreading Probability (p)</label>
            <span className="text-purple-400 font-mono">{(probability * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1.0}
            step={0.05}
            value={probability}
            onChange={(e) => setProbability(Number(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Intervention Budget */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <label className="text-slate-300">Intervention Budget (k)</label>
            <span className="text-purple-400 font-mono">{budget} nodes</span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.min(15, Math.max(1, numUsers - 1))}
            step={1}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Rumour Source Node */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Rumour Source</label>
            <select
              value={source}
              onChange={(e) => setSource(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-750 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-purple-500 focus:outline-none"
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Benchmark Trials</label>
            <input
              type="number"
              min={5}
              max={100}
              value={numRuns}
              onChange={(e) => setNumRuns(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-750 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-purple-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Optional Seed */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Random Seed <span className="text-slate-500">(Optional for reproducibility)</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 42"
            value={seed ?? ''}
            onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-slate-900 border border-slate-750 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-purple-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2.5">
        <button
          onClick={onGenerateNetwork}
          disabled={isGenerating || isSimulating || isComparing}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 transition-colors flex items-center justify-center space-x-2 border border-slate-700 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          ) : (
            <Network className="w-4 h-4 text-purple-400" />
          )}
          <span>{isGenerating ? 'Generating Network...' : 'Generate New Network'}</span>
        </button>

        <button
          onClick={onRunSimulation}
          disabled={isGenerating || isSimulating || isComparing}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSimulating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{isSimulating ? 'Propagating Rumour...' : 'Simulate Single Spread'}</span>
        </button>

        <button
          onClick={onCompareStrategies}
          disabled={isGenerating || isSimulating || isComparing}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isComparing ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{isComparing ? 'Benchmarking Strategies...' : 'Benchmark All Strategies'}</span>
        </button>
      </div>
    </div>
  );
};
