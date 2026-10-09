import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { NetworkGraph } from './components/NetworkGraph';
import { LiveStatusBar } from './components/LiveStatusBar';
import { NodeInspector } from './components/NodeInspector';
import { SpreadChart } from './components/SpreadChart';
import { StrategyComparison } from './components/StrategyComparison';
import { PlaybackControls } from './components/PlaybackControls';
import { InterventionPanel, InterventionAuditEntry } from './components/InterventionPanel';
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
  InterventionType,
  InterventionDetail,
} from './services/api';
import {
  AlertCircle,
  ChevronUp,
  ChevronDown,
  BarChart2,
  RefreshCw,
  Loader2,
  Terminal,
} from 'lucide-react';

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

  // Simulation Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Intervention Mode State
  const [isInterventionActive, setIsInterventionActive] = useState<boolean>(false);
  const [pendingInterventions, setPendingInterventions] = useState<number[]>([]);
  const [interventionDetails, setInterventionDetails] = useState<Record<number, InterventionType>>({});
  const [auditLog, setAuditLog] = useState<InterventionAuditEntry[]>([]);

  // Antidote configuration state
  const antidoteSources: number[] = [];
  const antidoteProbability = 0.5;

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
        setErrorMessage('Backend service offline. Please start FastAPI on port 8000.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Step Playback Loop Timer
  useEffect(() => {
    if (!isPlaying || !simulation?.spread_history?.length) return;
    const stepDelay = Math.max(80, Math.floor(1000 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= simulation.spread_history.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, stepDelay);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, simulation]);

  // Update node states based on current step index snapshot
  useEffect(() => {
    if (!simulation?.spread_history?.length) return;
    const currentSnapshot = simulation.spread_history[currentStepIndex];
    if (!currentSnapshot) return;

    const newStates: Record<string, NodeState> = {};
    newStates[String(source)] = 'active';

    for (let i = 0; i <= currentStepIndex; i++) {
      const stepObj = simulation.spread_history[i];
      if (stepObj?.newly_infected) {
        stepObj.newly_infected.forEach((nid) => {
          newStates[String(nid)] = 'active';
        });
      }
    }

    containedNodes.forEach((nid) => {
      newStates[String(nid)] = 'contained';
    });

    setNodeStates(newStates);
  }, [currentStepIndex, simulation, source, containedNodes]);

  const handleGenerateNetwork = async (
    usersToGen = numUsers,
    seedToUse = seed,
    isExplicitRegen = false
  ) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const finalSeed = isExplicitRegen && seedToUse === seed
        ? Math.floor(Math.random() * 1000000)
        : seedToUse;

      const resp = await generateNetwork(usersToGen, finalSeed);
      setNodes(resp.network.nodes);
      setEdges(resp.network.edges);
      setSource(resp.suggested_source);

      // Reset stale simulation & intervention states cleanly
      setSimulation(null);
      setComparison(null);
      setContainedNodes([]);
      setPendingInterventions([]);
      setInterventionDetails({});
      setAuditLog([]);
      setNodeStates({});
      setSelectedStrategyKey('none');
      setInspectedNodeId(null);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setApiOnline(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate network from backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunSimulation = async (
    interventionsToApply: number[] = containedNodes,
    detailsToApply: Record<number, InterventionType> = interventionDetails
  ) => {
    if (nodes.length === 0) return;
    setIsSimulating(true);
    setErrorMessage(null);

    if (interventionsToApply.length > budget) {
      setErrorMessage(`Intervention target count (${interventionsToApply.length}) exceeds active budget limit of ${budget}.`);
      setIsSimulating(false);
      return;
    }

    try {
      const formattedDetails: InterventionDetail[] = Object.entries(detailsToApply).map(
        ([nid, type]) => ({ node_id: Number(nid), type })
      );

      const resp = await runSimulation({
        nodes,
        edges,
        source,
        probability,
        interventions: interventionsToApply,
        budget: budget,
        intervention_details: formattedDetails,
        antidote_sources: antidoteSources,
        antidote_probability: antidoteProbability,
        seed: seed !== undefined ? seed + 10 : undefined,
      });
      setSimulation(resp);
      setNodeStates(resp.final_node_states);
      setContainedNodes(resp.interventions);
      setCurrentStepIndex(resp.spread_history.length > 0 ? resp.spread_history.length - 1 : 0);
      setIsPlaying(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to run simulation from backend.');
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

      const bestKey =
        Object.keys(resp.strategies).find(
          (k) => resp.strategies[k].strategy_name === resp.best_strategy
        ) || 'greedy';

      setSelectedStrategyKey(bestKey);
      const bestTargets = resp.strategies[bestKey]?.selected_nodes || [];
      setContainedNodes(bestTargets);

      setIsDrawerOpen(true);
      await handleRunSimulation(bestTargets, interventionDetails);
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

  const handleSelectNodeFromGraph = (nodeId: number) => {
    if (isInterventionActive) {
      // Toggle node selection for intervention targets
      if (pendingInterventions.includes(nodeId)) {
        setPendingInterventions((prev) => prev.filter((id) => id !== nodeId));
        setInterventionDetails((prev) => {
          const copy = { ...prev };
          delete copy[nodeId];
          return copy;
        });
      } else {
        if (pendingInterventions.length >= budget) {
          setErrorMessage(`Intervention limit reached (${pendingInterventions.length}/${budget}). Remove an existing target first.`);
          return;
        }
        setPendingInterventions((prev) => [...prev, nodeId]);
        setInterventionDetails((prev) => ({ ...prev, [nodeId]: 'isolate' }));
      }
    } else {
      // Standard inspection mode
      setInspectedNodeId(nodeId);
    }
  };

  const handleConfirmInterventions = async () => {
    if (pendingInterventions.length === 0) return;

    const newAuditEntries: InterventionAuditEntry[] = pendingInterventions.map((nid) => ({
      nodeId: nid,
      type: interventionDetails[nid] || 'isolate',
      step: currentStepIndex,
      status: 'applied',
    }));
    setAuditLog((prev) => [...prev, ...newAuditEntries]);

    await handleRunSimulation(pendingInterventions, interventionDetails);
    setPendingInterventions([]);
  };

  const handleToggleContainedNode = (nodeId: number) => {
    let updated: number[];
    if (containedNodes.includes(nodeId)) {
      updated = containedNodes.filter((id) => id !== nodeId);
    } else {
      if (containedNodes.length >= budget) {
        setErrorMessage(`Intervention budget limit reached (${containedNodes.length}/${budget}).`);
        return;
      }
      updated = [...containedNodes, nodeId];
    }
    setContainedNodes(updated);
    handleRunSimulation(updated);
  };

  const handleSetRumourSource = (nodeId: number) => {
    setSource(nodeId);
    handleRunSimulation(containedNodes);
  };

  const totalSteps = simulation?.spread_history?.length || 1;

  return (
    <div className="h-screen w-screen bg-[#08060B] text-[#F8F3FF] flex flex-col font-sans overflow-hidden bg-radial-purple select-none">
      {/* Top Application Navigation Bar */}
      <Header apiOnline={apiOnline} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      {activeTab === 'experiments' ? (
        /* Dedicated Experiments Dashboard Tab */
        <main className="flex-1 w-full h-[calc(100vh-64px)] overflow-y-auto p-6 space-y-6 bg-[#08060B]">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Title & Execution Bar */}
            <div className="glass-panel p-6 rounded-3xl border border-[#A855F7]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#F8F3FF] flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-[#FF3CAC]" />
                  <span>Rumour Containment Experiments & Strategy Benchmarks</span>
                </h2>
                <p className="text-xs text-[#B7A9C9] mt-1 max-w-2xl">
                  Run Monte Carlo stochastic trial comparisons across Random, Highest-Degree, and Greedy Influence Minimization algorithms. Export backend results directly to CSV.
                </p>
              </div>

              <button
                onClick={handleCompareStrategies}
                disabled={isGenerating || isSimulating || isComparing}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-[#39F5A5] to-[#22C55E] text-[#08060B] shadow-[0_0_20px_rgba(57,245,165,0.3)] hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-50 flex-shrink-0"
              >
                {isComparing ? <Loader2 className="w-4 h-4 animate-spin text-[#08060B]" /> : <BarChart2 className="w-4 h-4" />}
                <span>{isComparing ? 'Running Experiments...' : 'Benchmark All Strategies'}</span>
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-[#120D18] border border-[#FF365E]/40 text-[#FF365E] flex items-center space-x-3 text-xs">
                <AlertCircle className="w-4 h-4 text-[#FF365E]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Grid Layout: Propagation Curve & Strategy Comparison Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-6">
                <SpreadChart spreadHistory={simulation?.spread_history} />
              </div>

              <div className="lg:col-span-6 space-y-6">
                <StrategyComparison
                  comparisonData={comparison}
                  selectedStrategyKey={selectedStrategyKey}
                  onSelectStrategy={handleSelectStrategy}
                />
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Interactive Network Simulation Lab Tab */
        <main className="relative flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
          {/* Error Toast Banner */}
          {errorMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#120D18]/95 border border-[#FF365E]/40 text-[#FF365E] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs backdrop-blur-lg">
              <AlertCircle className="w-4 h-4 text-[#FF365E] flex-shrink-0" />
              <span>{errorMessage}</span>
              <button
                onClick={() => handleGenerateNetwork()}
                className="px-2.5 py-1 rounded-lg bg-[#FF365E]/20 hover:bg-[#FF365E]/30 text-[#FF365E] border border-[#FF365E]/40 font-medium transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State Overlay */}
          {nodes.length === 0 && !isGenerating ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#08060B]">
              <div className="w-16 h-16 rounded-2xl bg-[#1B1223] border border-[#A855F7]/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
                <RefreshCw className="w-8 h-8 text-[#A855F7]" />
              </div>
              <h3 className="text-lg font-bold text-[#F8F3FF]">No Social Network Loaded</h3>
              <p className="text-xs text-[#B7A9C9] max-w-sm mt-1 mb-4">
                Click below to generate a synthetic social network from the FastAPI backend.
              </p>
              <button
                onClick={() => handleGenerateNetwork()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#A855F7] to-[#FF3CAC] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:opacity-90 transition-all flex items-center space-x-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Generate Backend Network</span>
              </button>
            </div>
          ) : (
            /* Cytoscape Network Graph Canvas */
            <NetworkGraph
              nodes={nodes}
              edges={edges}
              nodeStates={nodeStates}
              sourceNode={source}
              containedNodes={containedNodes}
              pendingInterventions={pendingInterventions}
              antidoteNodes={antidoteSources}
              simulation={simulation}
              onSelectNode={handleSelectNodeFromGraph}
            />
          )}

          {/* Floating Live Status Bar (Top Left) */}
          <LiveStatusBar
            simulation={simulation}
            totalNodes={nodes.length}
            containedCount={containedNodes.length}
          />

          {/* Top-Right Control Console & Intervention Mode Dock */}
          <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-start space-x-3 max-w-[calc(100vw-32px)]">
            <InterventionPanel
              isActive={isInterventionActive}
              budget={budget}
              selectedNodes={pendingInterventions}
              interventionDetails={interventionDetails}
              auditLog={auditLog}
              currentStep={currentStepIndex}
              onToggleActive={() => {
                setIsPlaying(false);
                setIsInterventionActive(!isInterventionActive);
              }}
              onChangeMethod={(nid, type) =>
                setInterventionDetails((prev) => ({ ...prev, [nid]: type }))
              }
              onConfirmInterventions={handleConfirmInterventions}
              onCancelSelections={() => setPendingInterventions([])}
              onRemoveTarget={(nid) => {
                setPendingInterventions((prev) => prev.filter((id) => id !== nid));
                setInterventionDetails((prev) => {
                  const c = { ...prev };
                  delete c[nid];
                  return c;
                });
              }}
            />

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
              onGenerateNetwork={() => handleGenerateNetwork(numUsers, seed, true)}
              onRunSimulation={() => handleRunSimulation()}
              onCompareStrategies={handleCompareStrategies}
              isGenerating={isGenerating}
              isSimulating={isSimulating}
              isComparing={isComparing}
            />
          </div>

          {/* Simulation Playback Timeline Toolbar (Bottom Center, hidden when drawer is expanded to prevent overlap) */}
          {simulation && !isDrawerOpen && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 animate-in fade-in duration-200">
              <PlaybackControls
                isPlaying={isPlaying}
                currentStepIndex={currentStepIndex}
                totalSteps={totalSteps}
                history={simulation.spread_history}
                playbackSpeed={playbackSpeed}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onReset={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(0);
                }}
                onNextStep={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((p) => Math.min(totalSteps - 1, p + 1));
                }}
                onPrevStep={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((p) => Math.max(0, p - 1));
                }}
                onSeekStep={(stepIdx) => {
                  setIsPlaying(false);
                  setCurrentStepIndex(stepIdx);
                }}
                onChangeSpeed={(s) => setPlaybackSpeed(s)}
                antidoteReach={simulation.antidote_reach}
              />
            </div>
          )}

          {/* Contextual Node Inspector Overlay */}
          <NodeInspector
            nodeId={inspectedNodeId}
            nodes={nodes}
            edges={edges}
            nodeStates={nodeStates}
            sourceNode={source}
            containedNodes={containedNodes}
            budget={budget}
            simulation={simulation}
            probability={probability}
            seed={seed}
            onClose={() => setInspectedNodeId(null)}
            onSetSource={handleSetRumourSource}
            onToggleContained={handleToggleContainedNode}
          />

          {/* Floating Bottom Analytics Drawer */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
            {/* Drawer Handle / Toggle Pill */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="pointer-events-auto glass-panel px-5 py-1.5 rounded-t-2xl border-t border-x border-[#A855F7]/30 text-xs font-semibold text-[#F8F3FF] hover:text-[#FF3CAC] transition-all flex items-center space-x-2.5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] mb-0"
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
              <div className="pointer-events-auto w-full glass-panel-elevated p-6 rounded-t-3xl border-t border-[#A855F7]/30 shadow-2xl max-h-[50vh] overflow-y-auto space-y-6 animate-in slide-in-from-bottom duration-300">
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Integrated Playback Controls in Drawer Header (Zero Overlap) */}
                  {simulation && (
                    <div className="pb-2">
                      <PlaybackControls
                        isPlaying={isPlaying}
                        currentStepIndex={currentStepIndex}
                        totalSteps={totalSteps}
                        history={simulation.spread_history}
                        playbackSpeed={playbackSpeed}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onReset={() => {
                          setIsPlaying(false);
                          setCurrentStepIndex(0);
                        }}
                        onNextStep={() => {
                          setIsPlaying(false);
                          setCurrentStepIndex((p) => Math.min(totalSteps - 1, p + 1));
                        }}
                        onPrevStep={() => {
                          setIsPlaying(false);
                          setCurrentStepIndex((p) => Math.max(0, p - 1));
                        }}
                        onSeekStep={(stepIdx) => {
                          setIsPlaying(false);
                          setCurrentStepIndex(stepIdx);
                        }}
                        onChangeSpeed={(s) => setPlaybackSpeed(s)}
                        antidoteReach={simulation.antidote_reach}
                      />
                    </div>
                  )}

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
      )}
    </div>
  );
};

export default App;
