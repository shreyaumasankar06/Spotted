import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { NetworkGraph } from './components/NetworkGraph';
import { MetricsCards } from './components/MetricsCards';
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
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
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

  // Simulation & Comparison results
  const [simulation, setSimulation] = useState<SimulationRunResponse | null>(null);
  const [comparison, setComparison] = useState<InterventionCompareResponse | null>(null);
  const [selectedStrategyKey, setSelectedStrategyKey] = useState<string>('none');
  const [containedNodes, setContainedNodes] = useState<number[]>([]);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});

  // Loading flags
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Initial mount: check health and generate initial demo network
  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then(() => {
        if (!isMounted) return;
        setApiOnline(true);
        // Load initial network
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
      const bestKey = Object.keys(resp.strategies).find(
        (k) => resp.strategies[k].strategy_name === resp.best_strategy
      ) || 'greedy';

      setSelectedStrategyKey(bestKey);
      const bestTargets = resp.strategies[bestKey]?.selected_nodes || [];
      setContainedNodes(bestTargets);

      // Run a representative single simulation with best targets to visualize on graph
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
    // Visualize selected strategy on the graph
    handleRunSimulation(metrics.selected_nodes);
  };

  // Best metrics if available
  const bestMetrics =
    comparison && selectedStrategyKey && comparison.strategies[selectedStrategyKey]
      ? comparison.strategies[selectedStrategyKey]
      : null;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-sans">
      <Header apiOnline={apiOnline} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl flex items-center space-x-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Key Metrics Banner */}
        <MetricsCards
          simulation={simulation}
          bestMetrics={bestMetrics}
          baselineReach={comparison ? comparison.baseline_reach : null}
          totalNodes={nodes.length}
        />

        {/* Main Grid: Left Controls, Right Graph & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Controls (4 cols) */}
          <div className="lg:col-span-4">
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

          {/* Right Column: Visualization & Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <NetworkGraph
              nodes={nodes}
              edges={edges}
              nodeStates={nodeStates}
              sourceNode={source}
              containedNodes={containedNodes}
              selectedStrategyName={
                comparison && selectedStrategyKey
                  ? comparison.strategies[selectedStrategyKey]?.strategy_name
                  : undefined
              }
            />

            <SpreadChart spreadHistory={simulation?.spread_history} />
          </div>
        </div>

        {/* Strategy Benchmarks Section */}
        <StrategyComparison
          comparisonData={comparison}
          selectedStrategyKey={selectedStrategyKey}
          onSelectStrategy={handleSelectStrategy}
        />
      </main>

      <footer className="border-t border-slate-850 py-4 text-center text-xs text-slate-500 bg-[#0A0E17]">
        Spotted. &mdash; Built for collaborative branch-based development · FastAPI + NetworkX + React
      </footer>
    </div>
  );
};

export default App;
