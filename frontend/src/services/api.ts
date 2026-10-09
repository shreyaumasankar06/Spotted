/**
 * API client service for Spotted. — Rumour Containment Simulator
 * Connects frontend dashboard with the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type NodeState = 'unaware' | 'active' | 'contained';
export type InterventionType = 'isolate' | 'warn' | 'fact_check' | 'community_alert';

export interface Node {
  id: number;
  label?: string;
  state: NodeState;
  community?: number;
  degree?: number;
  speed?: number;
  reliability?: number;
}

export interface Edge {
  source: number;
  target: number;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  num_nodes: number;
  num_edges: number;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
}

export interface NetworkGenerateRequest {
  num_users?: number;
  seed?: number | null;
}

export interface NetworkGenerateResponse {
  network: GraphData;
  suggested_source: number;
  message: string;
}

export interface InterventionDetail {
  node_id: number;
  type: InterventionType;
}

export interface SpreadStep {
  step: number;
  active_count: number;
  contained_count: number;
  unaware_count: number;
  antidote_count?: number;
  newly_infected: number[];
  newly_corrected?: number[];
}

export interface SimulationRunRequest {
  nodes: Node[];
  edges: Edge[];
  source: number;
  probability: float;
  interventions?: number[];
  budget?: number;
  intervention_details?: InterventionDetail[];
  antidote_sources?: number[];
  antidote_probability?: number;
  seed?: number | null;
  max_steps?: number;
}

type float = number;

export interface SimulationRunResponse {
  source: number;
  interventions: number[];
  spread_history: SpreadStep[];
  final_reach: number;
  antidote_reach?: number;
  final_node_states: Record<string, NodeState>;
  antidote_states?: Record<string, 'aware' | 'unaware'>;
  steps_taken: number;
  total_nodes: number;
}

export interface StrategyMetrics {
  strategy_name: string;
  selected_nodes: number[];
  average_final_reach: number;
  standard_deviation: number;
  reduction_percentage: number;
  intervention_count: number;
  execution_time: number;
}

export interface InterventionCompareRequest {
  nodes: Node[];
  edges: Edge[];
  source: number;
  probability: number;
  budget: number;
  num_runs?: number;
  seed?: number | null;
}

export interface InterventionCompareResponse {
  baseline_reach: number;
  budget: number;
  num_runs: number;
  strategies: Record<string, StrategyMetrics>;
  best_strategy: string;
  summary: string;
}

/** Check health and backend connectivity */
export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

/** Request generation of a synthetic social network */
export async function generateNetwork(
  numUsers: number = 50,
  seed?: number | null
): Promise<NetworkGenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/api/network/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_users: numUsers, seed: seed ?? null }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Network generation failed (${res.status})`);
  }
  return res.json();
}

/** Run rumour propagation simulation */
export async function runSimulation(
  payload: SimulationRunRequest
): Promise<SimulationRunResponse> {
  const res = await fetch(`${API_BASE_URL}/api/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Simulation run failed (${res.status})`);
  }
  return res.json();
}

/** Compare baseline and greedy intervention strategies */
export async function compareInterventions(
  payload: InterventionCompareRequest
): Promise<InterventionCompareResponse> {
  const res = await fetch(`${API_BASE_URL}/api/interventions/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Strategy comparison failed (${res.status})`);
  }
  return res.json();
}
