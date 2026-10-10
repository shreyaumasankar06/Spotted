import React, { useState, useEffect } from 'react';
import { User, X, Shield, Radio, Sparkles, Loader2, Zap, Award } from 'lucide-react';
import { Node, NodeState, Edge, SimulationRunResponse, runSimulation } from '../services/api';
import { getUserFullName } from '../utils/names';

interface NodeInspectorProps {
  nodeId: number | null;
  nodes: Node[];
  edges: Edge[];
  nodeStates: Record<string, NodeState>;
  sourceNode: number;
  containedNodes: number[];
  budget: number;
  simulation?: SimulationRunResponse | null;
  probability: number;
  seed?: number;
  antidoteStates?: Record<string, 'aware' | 'unaware'>;
  onSpreadAntidote?: (nodeId: number) => void;
  isSpreadingAntidote?: boolean;
  onClose: () => void;
  onSetSource: (id: number) => void;
  onToggleContained: (id: number) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  nodeId,
  nodes,
  edges,
  nodeStates,
  sourceNode,
  containedNodes,
  budget,
  simulation,
  probability,
  seed,
  antidoteStates = {},
  onSpreadAntidote,
  isSpreadingAntidote = false,
  onClose,
  onSetSource,
  onToggleContained,
}) => {
  const [isCalculatingBenefit, setIsCalculatingBenefit] = useState<boolean>(false);
  const [estimatedBenefit, setEstimatedBenefit] = useState<{
    reduction: number;
    withReach: number;
    withoutReach: number;
  } | null>(null);

  // Recalculate estimated marginal benefit whenever the inspected node or network state changes
  useEffect(() => {
    if (nodeId === null || nodes.length === 0) {
      setEstimatedBenefit(null);
      return;
    }

    let isMounted = true;
    setIsCalculatingBenefit(true);

    const calculateMarginalBenefit = async () => {
      try {
        const isCurrentlyGuarded = containedNodes.includes(nodeId);
        
        // Base set without target node vs candidate set with target node
        const setWithoutNode = containedNodes.filter((id) => id !== nodeId);
        const setWithNode = isCurrentlyGuarded
          ? containedNodes
          : [...containedNodes, nodeId];

        // Perform evaluation trials (averaging over trials for realistic empirical estimation)
        const trials = 3;
        let totalWithoutReach = 0;
        let totalWithReach = 0;

        for (let i = 0; i < trials; i++) {
          const trialSeed = seed !== undefined ? seed + i * 7 : undefined;

          const resWithout = await runSimulation({
            nodes,
            edges,
            source: sourceNode,
            probability,
            interventions: setWithoutNode,
            seed: trialSeed,
          });

          const resWith = await runSimulation({
            nodes,
            edges,
            source: sourceNode,
            probability,
            interventions: setWithNode,
            seed: trialSeed,
          });

          totalWithoutReach += resWithout.final_reach;
          totalWithReach += resWith.final_reach;
        }

        if (!isMounted) return;

        const avgWithout = totalWithoutReach / trials;
        const avgWith = totalWithReach / trials;
        const netReduction = Math.max(0, avgWithout - avgWith);

        setEstimatedBenefit({
          reduction: netReduction,
          withoutReach: avgWithout,
          withReach: avgWith,
        });
      } catch (err) {
        console.warn('Failed to calculate estimated marginal benefit:', err);
      } finally {
        if (isMounted) {
          setIsCalculatingBenefit(false);
        }
      }
    };

    calculateMarginalBenefit();

    return () => {
      isMounted = false;
    };
  }, [nodeId, nodes, edges, sourceNode, containedNodes, probability, seed]);

  if (nodeId === null) return null;

  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) return null;

  const fullName = getUserFullName(nodeId);
  const isSource = nodeId === sourceNode;
  const isContained = containedNodes.includes(nodeId);
  const isBudgetFull = !isContained && containedNodes.length >= budget;
  const state: NodeState = isSource
    ? 'active'
    : isContained
    ? 'contained'
    : nodeStates[String(nodeId)] || targetNode.state || 'unaware';

  // Calculate connected edges & infected neighbors count
  const connectedEdges = edges.filter((e) => e.source === nodeId || e.target === nodeId);
  const degree = connectedEdges.length;
  const neighborIds = connectedEdges.map((e) => (e.source === nodeId ? e.target : e.source));

  let infectedNeighborsCount = 0;
  neighborIds.forEach((nbId) => {
    const nbState = nbId === sourceNode
      ? 'active'
      : containedNodes.includes(nbId)
      ? 'contained'
      : nodeStates[String(nbId)] || 'unaware';
    if (nbState === 'active') {
      infectedNeighborsCount++;
    }
  });

  // Infection Step timestamp
  let infectionStepText: string = 'Not infected';
  if (isSource) {
    infectionStepText = 'Step T+0 (Patient Zero)';
  } else if (state === 'active' && simulation?.spread_history) {
    const stepMatch = simulation.spread_history.find((s) => s.newly_infected.includes(nodeId));
    if (stepMatch) {
      infectionStepText = `Step T+${stepMatch.step}`;
    } else {
      infectionStepText = 'Active Spreader';
    }
  }

  return (
    <div className="absolute top-20 left-4 sm:left-6 z-30 w-80 sm:w-88 glass-panel-elevated p-4 rounded-2xl border border-[#A855F7]/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
      {/* Side Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#261A33]">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1B1223] border border-[#A855F7]/40 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <User className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8F3FF] leading-tight">{fullName}</h3>
            <span className="text-[11px] text-[#A855F7] font-mono font-medium">User #{nodeId}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#261A33] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Node Infection Status Badge & Budget Indicator */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#08060B]/70 border border-[#261A33]">
        <span className="text-xs text-[#B7A9C9] font-medium">Propagation Status</span>
        {isSource ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#FF365E]/20 text-[#FF365E] border border-[#FF365E]/40 flex items-center space-x-1">
            <Radio className="w-3 h-3" />
            <span>Rumour Source</span>
          </span>
        ) : isContained ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#39F5A5]/20 text-[#39F5A5] border border-[#39F5A5]/40 flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Contained ({containedNodes.length}/{budget})</span>
          </span>
        ) : state === 'active' ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#FF365E]/20 text-[#FF365E] border border-[#FF365E]/40">
            Active Spreader
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#756B80]/20 text-[#B7A9C9] border border-[#756B80]/40">
            Unaware
          </span>
        )}
      </div>

      {/* Network & Node Metrics Cards */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[#1B1223] border border-[#261A33]">
          <span className="text-[10px] text-[#B7A9C9] block">Node Connections</span>
          <span className="text-sm font-bold text-[#F8F3FF] font-mono">{degree} links</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1B1223] border border-[#261A33]">
          <span className="text-[10px] text-[#B7A9C9] block">Infected Neighbors</span>
          <span
            className={`text-sm font-bold font-mono ${
              infectedNeighborsCount > 0 ? 'text-[#FF365E]' : 'text-[#39F5A5]'
            }`}
          >
            {infectedNeighborsCount} / {degree}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1B1223] border border-[#261A33]">
          <span className="text-[10px] text-[#B7A9C9] flex items-center space-x-1 mb-0.5">
            <Zap className="w-3 h-3 text-[#A855F7]" />
            <span>Spread Speed</span>
          </span>
          <span className="text-sm font-bold text-[#F8F3FF] font-mono">
            {(targetNode.speed ?? 1.0).toFixed(2)}x
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1B1223] border border-[#261A33]">
          <span className="text-[10px] text-[#B7A9C9] flex items-center space-x-1 mb-0.5">
            <Award className="w-3 h-3 text-[#39F5A5]" />
            <span>Reliability</span>
          </span>
          <span className="text-sm font-bold text-[#39F5A5] font-mono">
            {(targetNode.reliability ?? 50.0).toFixed(0)} / 100
          </span>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-[#08060B]/80 border border-[#261A33] text-[10px] text-[#B7A9C9] leading-relaxed">
        <strong className="text-[#A855F7]">Perceived Credibility Note:</strong> Node reliability represents perceived user credibility (influencing rumour retransmission likelihood), while speed affects transmission delay. Reliability is perceived credibility, not proof of truth.
      </div>

      {/* Infection Step Information */}
      <div className="px-3 py-2 rounded-xl bg-[#1B1223]/70 border border-[#261A33] flex items-center justify-between text-xs">
        <span className="text-[#B7A9C9]">Infection Timestamp</span>
        <span className="font-mono text-[#F8F3FF] font-medium">{infectionStepText}</span>
      </div>

      {/* Antidote Awareness Status */}
      <div className="px-3 py-2 rounded-xl bg-[#1B1223]/70 border border-[#261A33] flex items-center justify-between text-xs">
        <span className="text-[#B7A9C9]">Antidote Awareness</span>
        {antidoteStates[String(nodeId)] === 'aware' || simulation?.antidote_states?.[String(nodeId)] === 'aware' ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#39F5A5]/20 text-[#39F5A5] border border-[#39F5A5]/40 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-[#39F5A5]" />
            <span>Correction-Aware</span>
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#756B80]/20 text-[#B7A9C9] border border-[#756B80]/40">
            Unaware
          </span>
        )}
      </div>

      {/* Estimated Marginal Benefit Widget (Requirement 4) */}
      <div className="p-3 rounded-2xl bg-[#08060B]/80 border border-[#A855F7]/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF3CAC]" />
            <span className="text-xs font-semibold text-[#F8F3FF]">
              Estimated Marginal Benefit
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#A855F7] bg-[#1B1223] px-1.5 py-0.5 rounded border border-[#261A33]">
            Estimated
          </span>
        </div>

        {isCalculatingBenefit ? (
          <div className="flex items-center space-x-2 py-2 text-xs text-[#B7A9C9]">
            <Loader2 className="w-4 h-4 animate-spin text-[#A855F7]" />
            <span>Calculating marginal reduction over trials...</span>
          </div>
        ) : estimatedBenefit ? (
          <div className="space-y-1 text-xs">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold text-[#39F5A5] font-mono">
                ~{estimatedBenefit.reduction.toFixed(1)}
              </span>
              <span className="text-[11px] text-[#B7A9C9]">
                fewer infected users (Est.)
              </span>
            </div>
            <p className="text-[10px] text-[#756B80] leading-relaxed">
              Based on repeated simulation trials. Labelled as an empirical estimate, not a guaranteed outcome.
            </p>
          </div>
        ) : (
          <span className="text-[11px] text-[#756B80] block py-1">
            Run simulation to compute marginal benefit.
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Antidote Action Button */}
        {antidoteStates[String(nodeId)] === 'aware' || simulation?.antidote_states?.[String(nodeId)] === 'aware' ? (
          <div className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#39F5A5]/15 text-[#39F5A5] border border-[#39F5A5]/40 flex items-center justify-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-[#39F5A5]" />
            <span>Antidote Active (Correction-Aware)</span>
          </div>
        ) : (
          <button
            onClick={() => onSpreadAntidote?.(nodeId)}
            disabled={isSpreadingAntidote}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#39F5A5]/20 hover:bg-[#39F5A5]/30 text-[#39F5A5] border border-[#39F5A5]/50 flex items-center justify-center space-x-2 transition-all shadow-[0_0_12px_rgba(57,245,165,0.2)] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#39F5A5]" />
            <span>{isSpreadingAntidote ? 'Spreading Antidote...' : 'Spread Antidote'}</span>
          </button>
        )}

        <button
          onClick={() => onSetSource(nodeId)}
          disabled={isSource}
          className="w-full py-2 px-3 rounded-xl text-xs font-medium bg-[#1B1223] hover:bg-[#261A33] text-[#FF365E] border border-[#FF365E]/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{isSource ? 'Currently Rumour Source' : 'Set as Rumour Source'}</span>
        </button>

        <button
          onClick={() => onToggleContained(nodeId)}
          disabled={isSource || isBudgetFull}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-center space-x-2 transition-all disabled:opacity-40 ${
            isContained
              ? 'bg-[#39F5A5]/20 text-[#39F5A5] border-[#39F5A5]/40 hover:bg-[#39F5A5]/30'
              : isBudgetFull
              ? 'bg-[#1B1223] text-[#756B80] border-[#261A33] cursor-not-allowed'
              : 'bg-[#120D18] text-[#39F5A5] border-[#39F5A5]/30 hover:bg-[#1B1223] shadow-[0_0_15px_rgba(57,245,165,0.1)]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-[#39F5A5]" />
          <span>
            {isContained
              ? 'Remove Intervention Guard'
              : isBudgetFull
              ? `Budget Limit Reached (${containedNodes.length}/${budget})`
              : `Add Intervention Guard (${containedNodes.length}/${budget})`}
          </span>
        </button>
      </div>
    </div>
  );
};

export default NodeInspector;
