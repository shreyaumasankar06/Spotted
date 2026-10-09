import React from 'react';
import { User, X, Shield, Radio } from 'lucide-react';
import { Node, NodeState, Edge } from '../services/api';

interface NodeInspectorProps {
  nodeId: number | null;
  nodes: Node[];
  edges: Edge[];
  nodeStates: Record<string, NodeState>;
  sourceNode: number;
  containedNodes: number[];
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
  onClose,
  onSetSource,
  onToggleContained,
}) => {
  if (nodeId === null) return null;

  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) return null;

  const isSource = nodeId === sourceNode;
  const isContained = containedNodes.includes(nodeId);
  const state: NodeState = isSource
    ? 'active'
    : isContained
    ? 'contained'
    : nodeStates[String(nodeId)] || targetNode.state || 'unaware';

  // Calculate node degree (number of connected edges)
  const connectedEdges = edges.filter((e) => e.source === nodeId || e.target === nodeId);
  const degree = connectedEdges.length;
  const neighbors = connectedEdges.map((e) => (e.source === nodeId ? e.target : e.source));

  return (
    <div className="absolute top-20 left-4 sm:left-6 z-30 w-72 sm:w-80 glass-panel-elevated p-4 rounded-2xl border border-[#A855F7]/30 shadow-2xl space-y-3.5 animate-in fade-in slide-in-from-left-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#261A33]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1B1223] border border-[#A855F7]/40 flex items-center justify-center">
            <User className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8F3FF]">User Profile: #{nodeId}</h3>
            <span className="text-[10px] text-[#B7A9C9] font-mono">Node Inspector</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#261A33] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Node Status Badge */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#08060B]/70 border border-[#261A33]">
        <span className="text-xs text-[#B7A9C9] font-medium">Infection Status</span>
        {isSource ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#FF365E]/20 text-[#FF365E] border border-[#FF365E]/40 flex items-center space-x-1">
            <Radio className="w-3 h-3" />
            <span>Patient Zero</span>
          </span>
        ) : isContained ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#39F5A5]/20 text-[#39F5A5] border border-[#39F5A5]/40 flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Firewalled</span>
          </span>
        ) : state === 'active' ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#FF365E]/20 text-[#FF365E] border border-[#FF365E]/40">
            Active Spreader
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#756B80]/20 text-[#B7A9C9] border border-[#756B80]/40">
            Unaware
          </span>
        )}
      </div>

      {/* Node Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[#1B1223] border border-[#261A33]">
          <span className="text-[10px] text-[#B7A9C9] block">Node Degree</span>
          <span className="text-base font-bold text-[#F8F3FF] font-mono">{degree} links</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1B1223] border border-[#261A33]">
          <span className="text-[10px] text-[#B7A9C9] block">Community Cluster</span>
          <span className="text-base font-bold text-[#A855F7] font-mono">
            Group #{targetNode.community ?? 0}
          </span>
        </div>
      </div>

      {/* Connected Neighbors list */}
      <div>
        <span className="text-[10px] text-[#B7A9C9] font-medium uppercase tracking-wider block mb-1">
          Connected Neighbors ({neighbors.length})
        </span>
        <div className="max-h-20 overflow-y-auto flex flex-wrap gap-1 p-1.5 rounded-xl bg-[#08060B]/60 border border-[#261A33]">
          {neighbors.length > 0 ? (
            neighbors.map((nb) => (
              <span
                key={nb}
                className="px-2 py-0.5 rounded bg-[#1B1223] text-[#B7A9C9] text-[11px] font-mono border border-[#261A33]"
              >
                U{nb}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[#756B80]">Isolated node</span>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-1.5 pt-1">
        <button
          onClick={() => onSetSource(nodeId)}
          disabled={isSource}
          className="w-full py-2 px-3 rounded-xl text-xs font-medium bg-[#1B1223] hover:bg-[#261A33] text-[#FF365E] border border-[#FF365E]/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{isSource ? 'Currently Patient Zero' : 'Set as Rumour Source'}</span>
        </button>

        <button
          onClick={() => onToggleContained(nodeId)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center space-x-2 transition-all ${
            isContained
              ? 'bg-[#39F5A5]/20 text-[#39F5A5] border-[#39F5A5]/40 hover:bg-[#39F5A5]/30'
              : 'bg-[#1B1223] text-[#39F5A5] border-[#39F5A5]/30 hover:bg-[#261A33]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{isContained ? 'Remove Intervention Guard' : 'Add Intervention Guard'}</span>
        </button>
      </div>
    </div>
  );
};

export default NodeInspector;
