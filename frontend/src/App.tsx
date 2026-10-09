import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { NetworkGraph } from './components/NetworkGraph';
import { LiveStatusBar } from './components/LiveStatusBar';
import { NodeInspector } from './components/NodeInspector';
import { SpreadChart } from './components/SpreadChart';
import { StrategyComparison } from './components/StrategyComparison';
import {
  checkHealth,
  generateNetwork,
  runSimulation,
  compareInterventions,
  Node,
  Edge,
  NodeState,
  SimulationRunResponse,
  InterventionCompareResponse,
  StrategyMetrics,
} from './services/api';
import { AlertCircle, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'lab' | 'experiments'>('lab');

  // Backend connection state
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configuration parameters
  const [numUsers, setNumUsers] = useState<number>(40);
  const [probability, setProbability] = useState<number>(0.35);
  const [budget, setBudget] = useState<number>(3);
  const [source, setSource] = useState<number>(0);
  const [numRuns, setNumRuns] = useState<number>(20);
  const [seed, setSeed] = useState<number | undefined>(42);

  // Network topology state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Selected node for inspection
  const [inspectedNodeId, setInspectedNodeId] = useState<number | null>(null);

  // Simulation & Comparison results
  const [simulation, setSimulation] = useState<SimulationRunResponse | null>(null);
  const [comparison, setComparison] = useState<InterventionCompareResponse | null>(null);
  const [selectedStrategyKey, setSelectedStrategyKey] = useState<string>('none');
  const [containedNodes, setContainedNodes] = useState<number[]>([]);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});

  // Collapsible Analytics Bottom Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Loading flags
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Initial mount: check health and generate initial social network
  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then(() => {
        if (!isMounted) return;
        setApiOnline(true);
        handleGenerateNetwork(40, 42);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Backend unavailable:', err);
        setApiOnline(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerateNetwork = async (usersToGen = numUsers, seedToUse = seed) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const resp = await generateNetwork(usersToGen, seedToUse);
      setNodes(resp.network.nodes);
      setEdges(resp.network.edges);
      setSource(resp.suggested_source);
      // Reset simulation states
      setSimulation(null);
      setComparison(null);
      setContainedNodes([]);
      setNodeStates({});
      setSelectedStrategyKey('none');
      setInspectedNodeId(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate network.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunSimulation = async (interventionsToApply: number[] = containedNodes) => {
    if (nodes.length === 0) return;
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      const resp = await runSimulation({
        nodes,
        edges,
        source,
        probability,
        interventions: interventionsToApply,
        seed: seed !== undefined ? seed + 10 : undefined,
      });
      setSimulation(resp);
      setNodeStates(resp.final_node_states);
      setContainedNodes(resp.interventions);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to run simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCompareStrategies = async () => {
    if (nodes.length === 0) return;
    setIsComparing(true);
    setErrorMessage(null);
    try {
      const resp = await compareInterventions({
        nodes,
        edges,
        source,
        probability,
        budget,
        num_runs: numRuns,
        seed,
      });
      setComparison(resp);

      // Highlight best strategy by default
      const bestKey =
        Object.keys(resp.strategies).find(
          (k) => resp.strategies[k].strategy_name === resp.best_strategy
        ) || 'greedy';

      setSelectedStrategyKey(bestKey);
      const bestTargets = resp.strategies[bestKey]?.selected_nodes || [];
      setContainedNodes(bestTargets);

      // Automatically expand analytics drawer to show benchmarks
      setIsDrawerOpen(true);

      // Run representative single simulation with best targets for graph display
      await handleRunSimulation(bestTargets);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to compare strategies.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleSelectStrategy = (key: string, metrics: StrategyMetrics) => {
    setSelectedStrategyKey(key);
    setContainedNodes(metrics.selected_nodes);
    handleRunSimulation(metrics.selected_nodes);
  };

  const handleToggleContainedNode = (nodeId: number) => {
    let updated: number[];
    if (containedNodes.includes(nodeId)) {
      updated = containedNodes.filter((id) => id !== nodeId);
    } else {
      updated = [...containedNodes, nodeId];
    }
    setContainedNodes(updated);
    handleRunSimulation(updated);
  };

  const handleSetRumourSource = (nodeId: number) => {
    setSource(nodeId);
    handleRunSimulation(containedNodes);
  };


  return (
    <div className="h-screen w-screen bg-[#08060B] text-[#F8F3FF] flex flex-col font-sans overflow-hidden bg-radial-purple select-none">
      {/* Header Bar */}
      <Header apiOnline={apiOnline} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Investigation Canvas Workspace */}
      <main className="relative flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
        {/* Error Notification Toast */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#120D18]/90 border border-[#FF365E]/40 text-[#FF365E] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs backdrop-blur-lg">
            <AlertCircle className="w-4 h-4 text-[#FF365E] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Full-Viewport Cytoscape Graph Canvas */}
        <NetworkGraph
          nodes={nodes}
          edges={edges}
          nodeStates={nodeStates}
          sourceNode={source}
          containedNodes={containedNodes}
          onSelectNode={(id) => setInspectedNodeId(id)}
        />

        {/* Floating Live Status Bar (Top Left) */}
        <LiveStatusBar
          simulation={simulation}
          totalNodes={nodes.length}
          containedCount={containedNodes.length}
        />

        {/* Floating Simulation Control Console (Top Right Corner) */}
        <div className="absolute top-4 right-4 sm:right-6 z-30">
          <ControlPanel
            numUsers={numUsers}
            setNumUsers={setNumUsers}
            probability={probability}
            setProbability={setProbability}
            budget={budget}
            setBudget={setBudget}
            source={source}
            setSource={setSource}
            numRuns={numRuns}
            setNumRuns={setNumRuns}
            seed={seed}
            setSeed={setSeed}
            availableNodes={nodes.map((n) => n.id)}
            onGenerateNetwork={() => handleGenerateNetwork()}
            onRunSimulation={() => handleRunSimulation()}
            onCompareStrategies={handleCompareStrategies}
            isGenerating={isGenerating}
            isSimulating={isSimulating}
            isComparing={isComparing}
          />
        </div>

        {/* Contextual Node Inspector Overlay */}
        <NodeInspector
          nodeId={inspectedNodeId}
          nodes={nodes}
          edges={edges}
          nodeStates={nodeStates}
          sourceNode={source}
          containedNodes={containedNodes}
          onClose={() => setInspectedNodeId(null)}
          onSetSource={handleSetRumourSource}
          onToggleContained={handleToggleContainedNode}
        />

        {/* Floating Bottom Analytics Drawer */}
        <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center">
          {/* Drawer Handle / Toggle Pill */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="glass-panel px-5 py-2 rounded-t-2xl border-t border-x border-[#A855F7]/30 text-xs font-semibold text-[#F8F3FF] hover:text-[#FF3CAC] transition-all flex items-center space-x-2.5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] -mb-[1px]"
          >
            <BarChart2 className="w-4 h-4 text-[#A855F7]" />
            <span>
              {isDrawerOpen ? 'Hide Analytics Drawer' : 'View Propagation & Strategy Analytics'}
            </span>
            {comparison && (
              <span className="text-[10px] bg-[#39F5A5]/20 text-[#39F5A5] px-2 py-0.5 rounded-full border border-[#39F5A5]/30 font-mono">
                Optimal: {comparison.best_strategy}
              </span>
            )}
            {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Drawer Content Body */}
          {isDrawerOpen && (
            <div className="w-full glass-panel-elevated p-6 rounded-t-3xl border-t border-[#A855F7]/30 shadow-2xl max-h-[55vh] overflow-y-auto space-y-6 animate-in slide-in-from-bottom duration-300">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Timeline Spread & Benchmark Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6">
                    <SpreadChart spreadHistory={simulation?.spread_history} />
                  </div>

                  <div className="lg:col-span-6">
                    <StrategyComparison
                      comparisonData={comparison}
                      selectedStrategyKey={selectedStrategyKey}
                      onSelectStrategy={handleSelectStrategy}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
