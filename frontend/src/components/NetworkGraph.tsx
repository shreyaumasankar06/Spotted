import React, { useEffect, useRef } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { Node, Edge, NodeState } from '../services/api';
import { Maximize2, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  nodeStates?: Record<string, NodeState>;
  sourceNode?: number;
  containedNodes?: number[];
  onSelectNode?: (nodeId: number) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  nodeStates = {},
  sourceNode,
  containedNodes = [],
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Map Nodes
    nodes.forEach((n) => {
      const state = nodeStates[String(n.id)] || n.state || 'unaware';
      const isSource = n.id === sourceNode;
      const isContained = containedNodes.includes(n.id) || state === 'contained';

      // Colors following the exact user specification:
      // Spreading/Source: #FF365E
      // Contained: #39F5A5
      // Unaware: #756B80
      let nodeColor = '#756B80';
      let borderColor = '#4A3E59';
      let borderWidth = 1;
      let nodeSize = 22;

      if (isSource) {
        nodeColor = '#FF365E';
        borderColor = '#FF3CAC';
        borderWidth = 4;
        nodeSize = 30;
      } else if (isContained) {
        nodeColor = '#39F5A5';
        borderColor = '#22C55E';
        borderWidth = 2.5;
        nodeSize = 24;
      } else if (state === 'active') {
        nodeColor = '#FF365E';
        borderColor = '#FF3CAC';
        borderWidth = 2.5;
        nodeSize = 26;
      }

      elements.push({
        data: {
          id: String(n.id),
          label: `U${n.id}`,
          color: nodeColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          size: nodeSize,
          community: n.community ?? 0,
        },
      });
    });

    // Map Edges
    edges.forEach((e, idx) => {
      elements.push({
        data: {
          id: `e-${e.source}-${e.target}-${idx}`,
          source: String(e.source),
          target: String(e.target),
        },
      });
    });

    // Initialize Cytoscape Instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#F8F3FF',
            'font-size': '10px',
            'font-family': 'Inter, sans-serif',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 'data(size)',
            'height': 'data(size)',
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
            'line-color': '#261A33',
            'opacity': 0.75,
            'curve-style': 'bezier',
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#A855F7',
            'overlay-color': '#A855F7',
            'overlay-padding': 6,
            'overlay-opacity': 0.3,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 70,
        gravity: 0.25,
      },
      minZoom: 0.2,
      maxZoom: 3.5,
      wheelSensitivity: 0.25,
    });

    // Handle node click event
    cy.on('tap', 'node', (evt) => {
      const nodeObj = evt.target;
      const nodeId = Number(nodeObj.id());
      if (onSelectNode) {
        onSelectNode(nodeId);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges, nodeStates, sourceNode, containedNodes, onSelectNode]);

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 40);
    }
  };

  const handleResetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({ name: 'cose', animate: true, animationDuration: 400 }).run();
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.25);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#08060B] overflow-hidden select-none">
      {/* Network Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Canvas Controls (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center space-x-1.5 glass-panel p-1.5 rounded-xl border border-[#A855F7]/20 shadow-xl">
        <button
          onClick={handleZoomIn}
          title="Zoom in"
          className="p-2 rounded-lg hover:bg-[#1B1223] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          className="p-2 rounded-lg hover:bg-[#1B1223] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-[#261A33]" />
        <button
          onClick={handleFit}
          title="Fit view"
          className="p-2 rounded-lg hover:bg-[#1B1223] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetLayout}
          title="Re-layout topology"
          className="p-2 rounded-lg hover:bg-[#1B1223] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Legend Overlay (Top Left below status) */}
      <div className="absolute top-20 left-6 z-20 hidden lg:flex items-center space-x-4 glass-panel px-3.5 py-2 rounded-xl border border-[#261A33] text-[11px] text-[#B7A9C9]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF365E] shadow-[0_0_8px_#FF365E]"></span>
          <span className="font-medium text-[#F8F3FF]">Source User</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF365E]"></span>
          <span>Spreading</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#39F5A5] shadow-[0_0_6px_#39F5A5]"></span>
          <span>Contained</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#756B80]"></span>
          <span>Unaware</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
