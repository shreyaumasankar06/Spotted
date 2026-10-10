import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { Node, Edge, NodeState, SimulationRunResponse } from '../services/api';
import { Maximize2, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import HoverTooltip, { HoveredNodeInfo } from './HoverTooltip';

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  nodeStates?: Record<string, NodeState>;
  sourceNode?: number;
  containedNodes?: number[];
  pendingInterventions?: number[];
  antidoteNodes?: number[];
  antidoteStates?: Record<string, 'aware' | 'unaware'>;
  simulation?: SimulationRunResponse | null;
  onSelectNode?: (nodeId: number) => void;
  onSpreadAntidote?: (nodeId: number) => void;
  isSpreadingAntidote?: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  nodeStates = {},
  sourceNode,
  containedNodes = [],
  pendingInterventions = [],
  antidoteNodes = [],
  antidoteStates = {},
  simulation,
  onSelectNode,
  onSpreadAntidote,
  isSpreadingAntidote = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest onSelectNode callback ref stable
  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  // Hovered node state for floating tooltip
  const [hoverInfo, setHoverInfo] = useState<HoveredNodeInfo | null>(null);

  // 1. Initialise Cytoscape Graph & Layout ONCE when topology (nodes/edges) changes
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Destroy existing instance before building a new topology
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Map Nodes
    nodes.forEach((n) => {
      elements.push({
        data: {
          id: String(n.id),
          label: `U${n.id}`,
          color: '#756B80',
          borderColor: '#4A3E59',
          borderWidth: 1.5,
          size: 22,
          shape: 'ellipse',
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

    // Instantiate Cytoscape
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
            'shape': 'ellipse',
            'border-width': 'data(borderWidth)',
            'border-color': 'data(borderColor)',
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': 0.2,
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
        nodeRepulsion: () => 6500,
        idealEdgeLength: () => 75,
        gravity: 0.2,
      },
      minZoom: 0.2,
      maxZoom: 3.5,
      wheelSensitivity: 0.25,
    });

    // Event Listener: Hover tooltip with smooth transition debounce
    cy.on('mouseover', 'node', (evt) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      const nodeObj = evt.target;
      const nodeId = Number(nodeObj.id());
      const renderedPos = nodeObj.renderedPosition();
      const containerBounds = containerRef.current?.getBoundingClientRect();

      if (containerBounds) {
        setHoverInfo({
          nodeId,
          x: containerBounds.left + renderedPos.x,
          y: containerBounds.top + renderedPos.y,
        });
      }
    });

    cy.on('mouseout', 'node', () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverInfo(null);
      }, 350);
    });

    // Event Listener: Tap / Click node (does not rerun layout or move nodes)
    cy.on('tap', 'node', (evt) => {
      const nodeObj = evt.target;
      const nodeId = Number(nodeObj.id());
      if (onSelectNodeRef.current) {
        onSelectNodeRef.current(nodeId);
      }
    });

    cyRef.current = cy;

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges]);

  // Keep tooltip open when mouse is hovering over the tooltip itself
  const handleMouseEnterTooltip = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveTooltip = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverInfo(null);
    }, 250);
  };

  // 2. In-Place Visual Style Updates (ZERO layout recalculation or node movement)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    cy.batch(() => {
      nodes.forEach((n) => {
        const cyNode = cy.getElementById(String(n.id));
        if (!cyNode || cyNode.length === 0) return;

        const state = nodeStates[String(n.id)] || n.state || 'unaware';
        const isSource = n.id === sourceNode;
        const isContained = containedNodes.includes(n.id) || state === 'contained';
        const isPending = pendingInterventions.includes(n.id);
        const isAntidote =
          antidoteNodes.includes(n.id) ||
          antidoteStates[String(n.id)] === 'aware' ||
          simulation?.antidote_states?.[String(n.id)] === 'aware';

        let nodeColor = '#756B80'; // Unaware
        let borderColor = '#4A3E59';
        let borderWidth = 1.5;
        let nodeSize = 22;

        if (isAntidote) {
          // Bright green signal for Antidote awareness
          nodeColor = '#39F5A5';
          if (isSource) {
            borderColor = '#FF365E'; // Retain rumour source border
            borderWidth = 4;
            nodeSize = 30;
          } else if (state === 'active') {
            borderColor = '#FF3CAC'; // Retain rumour active border
            borderWidth = 3;
            nodeSize = 25;
          } else if (isPending) {
            borderColor = '#A855F7';
            borderWidth = 3;
            nodeSize = 26;
          } else {
            borderColor = '#22C55E';
            borderWidth = 3;
            nodeSize = 24;
          }
        } else if (isSource) {
          nodeColor = '#FF365E';
          borderColor = '#FF3CAC';
          borderWidth = 4;
          nodeSize = 30;
        } else if (isPending) {
          nodeColor = '#A855F7';
          borderColor = '#FF3CAC';
          borderWidth = 3;
          nodeSize = 26;
        } else if (isContained) {
          nodeColor = '#39F5A5';
          borderColor = '#22C55E';
          borderWidth = 3;
          nodeSize = 24;
        } else if (state === 'active') {
          nodeColor = '#FF365E';
          borderColor = '#FF3CAC';
          borderWidth = 2.5;
          nodeSize = 24;
        }

        cyNode.data({
          color: nodeColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          size: nodeSize,
        });
      });
    });
  }, [nodes, nodeStates, sourceNode, containedNodes, pendingInterventions, antidoteNodes, antidoteStates, simulation]);

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

      {/* Hover Tooltip Overlay */}
      <HoverTooltip
        hoverInfo={hoverInfo}
        nodes={nodes}
        edges={edges}
        nodeStates={nodeStates}
        sourceNode={sourceNode ?? 0}
        containedNodes={containedNodes}
        simulation={simulation}
        antidoteStates={antidoteStates}
        onSpreadAntidote={onSpreadAntidote}
        isSpreadingAntidote={isSpreadingAntidote}
        onMouseEnter={handleMouseEnterTooltip}
        onMouseLeave={handleMouseLeaveTooltip}
      />

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
          title="Fit view to screen"
          className="p-2 rounded-lg hover:bg-[#1B1223] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetLayout}
          title="Reset topology layout"
          className="p-2 rounded-lg hover:bg-[#1B1223] text-[#B7A9C9] hover:text-[#F8F3FF] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Legend Overlay (Top Left below status bar) */}
      <div className="absolute top-20 left-6 z-20 hidden lg:flex items-center space-x-4 glass-panel px-3.5 py-2 rounded-xl border border-[#261A33] text-[11px] text-[#B7A9C9]">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF365E] border-2 border-[#FF3CAC] shadow-[0_0_8px_#FF365E]"></span>
          <span className="font-medium text-[#F8F3FF]">Source</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF365E]"></span>
          <span>Spreading</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#39F5A5] border border-[#22C55E] shadow-[0_0_6px_#39F5A5]"></span>
          <span className="text-[#39F5A5] font-medium">Antidote / Contained</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] border border-[#FF3CAC]"></span>
          <span>Pending Target</span>
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
