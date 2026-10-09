import React from 'react';
import { User, Shield, Radio, Zap, Award } from 'lucide-react';
import { Node, Edge, NodeState, SimulationRunResponse } from '../services/api';
import { getUserFullName } from '../utils/names';

export interface HoveredNodeInfo {
  nodeId: number;
  x: number;
  y: number;
}

interface HoverTooltipProps {
  hoverInfo: HoveredNodeInfo | null;
  nodes: Node[];
  edges: Edge[];
  nodeStates: Record<string, NodeState>;
  sourceNode: number;
  containedNodes: number[];
  simulation?: SimulationRunResponse | null;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  hoverInfo,
  nodes,
  edges,
  nodeStates,
  sourceNode,
  containedNodes,
  simulation,
}) => {
  if (!hoverInfo) return null;

  const { nodeId, x, y } = hoverInfo;
  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) return null;

  const fullName = getUserFullName(nodeId);
  const isSource = nodeId === sourceNode;
  const isContained = containedNodes.includes(nodeId);
  const state: NodeState = isSource
    ? 'active'
    : isContained
    ? 'contained'
    : nodeStates[String(nodeId)] || targetNode.state || 'unaware';

  const isAntidoteAware = simulation?.antidote_states?.[String(nodeId)] === 'aware';

  const speed = targetNode.speed ?? 1.0;
  const reliability = targetNode.reliability ?? 50.0;

  // Calculate connected edges & infected neighbors count locally
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

  // Infection Step: Find step index from spread history
  let infectionStep: string = 'N/A';
  if (isSource) {
    infectionStep = 'T+0 (Patient Zero)';
  } else if (state === 'active' && simulation?.spread_history) {
    const stepMatch = simulation.spread_history.find((s) => s.newly_infected.includes(nodeId));
    if (stepMatch) {
      infectionStep = `T+${stepMatch.step}`;
    } else {
      infectionStep = 'Active';
    }
  }

  // Intervention eligibility
  let eligibilityText = 'Eligible for Containment';
  let eligibilityColor = 'text-[#39F5A5] border-[#39F5A5]/30 bg-[#39F5A5]/10';
  if (isSource) {
    eligibilityText = 'Ineligible (Patient Zero)';
    eligibilityColor = 'text-[#FF365E] border-[#FF365E]/30 bg-[#FF365E]/10';
  } else if (isContained) {
    eligibilityText = 'Currently Guarded';
    eligibilityColor = 'text-[#A855F7] border-[#A855F7]/30 bg-[#A855F7]/10';
  }

  // Position offset to prevent mouse occlusion or clipping at viewport boundary
  const tooltipWidth = 270;
  const tooltipHeight = 250;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  let leftPos = x + 18;
  let topPos = y + 18;

  if (leftPos + tooltipWidth > screenWidth - 20) {
    leftPos = x - tooltipWidth - 14;
  }
  if (topPos + tooltipHeight > screenHeight - 20) {
    topPos = y - tooltipHeight - 14;
  }

  return (
    <div
      style={{ left: `${leftPos}px`, top: `${topPos}px` }}
      className="fixed z-50 w-68 glass-panel p-3.5 rounded-2xl border border-[#A855F7]/30 shadow-[0_16px_40px_rgba(0,0,0,0.85)] pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 text-xs space-y-2"
    >
      {/* Header: Name & ID */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#261A33]">
        <div>
          <h4 className="font-bold text-[#F8F3FF] text-xs leading-tight">{fullName}</h4>
          <span className="text-[10px] text-[#A855F7] font-mono font-medium">User #{nodeId}</span>
        </div>
        <div className="w-6 h-6 rounded-lg bg-[#1B1223] border border-[#261A33] flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-[#A855F7]" />
        </div>
      </div>

      {/* State & Infection Badge */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#B7A9C9]">Status ({infectionStep})</span>
        {isSource ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#FF365E]/20 text-[#FF365E] border border-[#FF365E]/40 flex items-center space-x-1">
            <Radio className="w-2.5 h-2.5" />
            <span>Rumour Source</span>
          </span>
        ) : isContained ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#39F5A5]/20 text-[#39F5A5] border border-[#39F5A5]/40 flex items-center space-x-1">
            <Shield className="w-2.5 h-2.5" />
            <span>Contained</span>
          </span>
        ) : state === 'active' ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#FF365E]/20 text-[#FF365E] border border-[#FF365E]/40">
            Actively Spreading
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#756B80]/20 text-[#B7A9C9] border border-[#756B80]/40">
            Unaware
          </span>
        )}
      </div>

      {/* Attributes Grid: Speed & Reliability */}
      <div className="grid grid-cols-2 gap-1 text-[11px]">
        <div className="p-1.5 rounded-xl bg-[#1B1223]/80 border border-[#261A33]">
          <span className="text-[9px] text-[#B7A9C9] block flex items-center space-x-1">
            <Zap className="w-2.5 h-2.5 text-[#A855F7]" />
            <span>Spread Speed</span>
          </span>
          <span className="font-bold text-[#F8F3FF] font-mono">{speed.toFixed(2)}x</span>
        </div>

        <div className="p-1.5 rounded-xl bg-[#1B1223]/80 border border-[#261A33]">
          <span className="text-[9px] text-[#B7A9C9] block flex items-center space-x-1">
            <Award className="w-2.5 h-2.5 text-[#39F5A5]" />
            <span>Reliability</span>
          </span>
          <span className="font-bold text-[#39F5A5] font-mono">{reliability.toFixed(0)} / 100</span>
        </div>
      </div>

      {/* Network Connectivity & Antidote Awareness */}
      <div className="grid grid-cols-2 gap-1 text-[11px]">
        <div className="p-1.5 rounded-xl bg-[#1B1223]/80 border border-[#261A33]">
          <span className="text-[9px] text-[#B7A9C9] block">Infected Nbrs</span>
          <span
            className={`font-bold font-mono ${
              infectedNeighborsCount > 0 ? 'text-[#FF365E]' : 'text-[#39F5A5]'
            }`}
          >
            {infectedNeighborsCount} / {degree}
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-[#1B1223]/80 border border-[#261A33]">
          <span className="text-[9px] text-[#B7A9C9] block">Antidote Aware</span>
          <span
            className={`font-bold font-mono ${
              isAntidoteAware ? 'text-[#A855F7]' : 'text-[#756B80]'
            }`}
          >
            {isAntidoteAware ? 'Aware' : 'Unaware'}
          </span>
        </div>
      </div>

      {/* Eligibility Badge */}
      <div className={`px-2 py-0.5 rounded-xl text-[10px] font-medium border text-center ${eligibilityColor}`}>
        {eligibilityText}
      </div>
    </div>
  );
};

export default HoverTooltip;
