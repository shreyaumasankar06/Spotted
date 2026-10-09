import React, { useEffect, useRef } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { Node, Edge, NodeState } from '../services/api';
import { Maximize2, RefreshCw } from 'lucide-react';

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  nodeStates?: Record<string, NodeState>;
  sourceNode?: number;
  containedNodes?: number[];
  selectedStrategyName?: string;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  nodeStates = {},
  sourceNode,
  containedNodes = [],
  selectedStrategyName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Build cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [];

    // Map nodes
    nodes.forEach((n) => {
      const state = nodeStates[String(n.id)] || n.state || 'unaware';
      const isSource = n.id === sourceNode;
      const isContained = containedNodes.includes(n.id) || state === 'contained';

      let nodeColor = '#64748B'; // unaware (slate)
      let borderColor = '#475569';
      let borderWidth = 1;

      if (isSource) {
        nodeColor = '#F59E0B'; // Amber
        borderColor = '#FBBF24';
        borderWidth = 3;
      } else if (isContained) {
        nodeColor = '#10B981'; // Contained (emerald)
        borderColor = '#34D399';
        borderWidth = 2;
      } else if (state === 'active') {
        nodeColor = '#EF4444'; // Active spreader (red)
        borderColor = '#F87171';
        borderWidth = 2;
      }

      elements.push({
        data: {
          id: String(n.id),
          label: String(n.id),
          color: nodeColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          community: n.community ?? 0,
        },
      });
    });

    // Map edges
    edges.forEach((e, idx) => {
      elements.push({
        data: {
          id: `e-${e.source}-${e.target}-${idx}`,
          source: String(e.source),
          target: String(e.target),
        },
      });
    });

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#F8FAFC',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 24,
            'height': 24,
            'border-width': 'data(borderWidth)',
            'border-color': 'data(borderColor)',
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': 0.3,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#334155',
            'opacity': 0.6,
            'curve-style': 'straight',
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 3,
            'border-color': '#A78BFA',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        nodeRepulsion: () => 4500,
        idealEdgeLength: () => 60,
      },
      minZoom: 0.2,
      maxZoom: 3.0,
      wheelSensitivity: 0.2,
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges, nodeStates, sourceNode, containedNodes]);

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 30);
    }
  };

  const handleResetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({ name: 'cose', animate: true, animationDuration: 400 }).run();
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[520px] relative">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">
            Interactive Network Topology
          </h2>
          <p className="text-xs text-slate-400">
            {nodes.length} nodes · {edges.length} edges
            {selectedStrategyName ? ` · Displaying: ${selectedStrategyName}` : ''}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleFit}
            title="Fit to view"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetLayout}
            title="Re-layout network"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cytoscape Canvas */}
      <div
        ref={containerRef}
        className="w-full flex-1 rounded-xl bg-[#080C14]/90 overflow-hidden border border-slate-850"
      />

      {/* Legend */}
      <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-[#FBBF24]"></span>
          <span>Source User</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-[#F87171]"></span>
          <span>Active Spreader</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#10B981] border border-[#34D399]"></span>
          <span>Contained (Intervened)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#64748B] border border-[#475569]"></span>
          <span>Unaware User</span>
        </div>
      </div>
    </div>
  );
};
