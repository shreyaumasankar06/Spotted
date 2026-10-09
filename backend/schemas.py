"""Pydantic schemas and data contracts for Spotted.

Defines all request, response, and intermediate data models with strict
type validation and descriptive constraints for API serialization.
"""

from enum import Enum
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class NodeState(str, Enum):
    """Possible states for a user node during rumour propagation.
    
    - unaware: Has not encountered the rumour.
    - active: Currently exposed and actively attempting to spread the rumour.
    - contained: Intervened upon and prevented from contracting or spreading the rumour.
    """
    UNAWARE = "unaware"
    ACTIVE = "active"
    CONTAINED = "contained"


class Node(BaseModel):
    """Represents an individual social network user node."""
    id: int = Field(..., description="Unique integer identifier of the user node")
    label: Optional[str] = Field(None, description="Display label (e.g., 'User 0')")
    state: NodeState = Field(default=NodeState.UNAWARE, description="Current propagation state")
    community: Optional[int] = Field(None, description="Community cluster identifier")
    degree: Optional[int] = Field(None, description="Number of direct connections")
    speed: float = Field(default=1.0, ge=0.1, le=2.0, description="Transmission frequency/speed factor (0.1 to 2.0)")
    reliability: float = Field(default=50.0, ge=0.0, le=100.0, description="Perceived credibility score (0 to 100)")


class Edge(BaseModel):
    """Represents a social connection (undirected relationship) between two users."""
    source: int = Field(..., description="Node ID of one endpoint")
    target: int = Field(..., description="Node ID of the second endpoint")


class GraphData(BaseModel):
    """Structured representation of a graph for API transport and Cytoscape rendering."""
    nodes: List[Node] = Field(..., description="List of network nodes")
    edges: List[Edge] = Field(..., description="List of network edges")
    num_nodes: int = Field(..., description="Total node count")
    num_edges: int = Field(..., description="Total edge count")


# ==============================================================================
# Network Generation Schemas (Person 1)
# ==============================================================================

class NetworkGenerateRequest(BaseModel):
    """Request payload to generate a synthetic social network."""
    num_users: int = Field(
        default=50,
        ge=5,
        le=1000,
        description="Number of nodes in the synthetic social network (5 to 1000)"
    )
    seed: Optional[int] = Field(
        default=None,
        description="Optional seed for deterministic generation reproducibility"
    )


class NetworkGenerateResponse(BaseModel):
    """Response payload containing generated social network."""
    network: GraphData = Field(..., description="Generated graph data")
    suggested_source: int = Field(..., description="A recommended initial rumour source node ID")
    message: str = Field(default="Network generated successfully", description="Status message")


# ==============================================================================
# Spread Simulation Schemas (Person 1)
# ==============================================================================

class InterventionDetail(BaseModel):
    """Specific intervention configuration for a target node."""
    node_id: int = Field(..., description="Target node ID")
    type: str = Field(
        default="isolate",
        description="Intervention type: 'isolate', 'warn', 'fact_check', 'community_alert'"
    )


class SpreadStep(BaseModel):
    """Snapshot of rumour propagation and antidote state at a discrete time step."""
    step: int = Field(..., description="Time step index (0 = initial state)")
    active_count: int = Field(..., description="Number of actively spreading nodes at this step")
    contained_count: int = Field(..., description="Number of contained nodes at this step")
    unaware_count: int = Field(..., description="Number of unaware nodes at this step")
    antidote_count: int = Field(default=0, description="Number of antidote-aware nodes at this step")
    newly_infected: List[int] = Field(default_factory=list, description="Nodes exposed at this specific step")
    newly_corrected: List[int] = Field(default_factory=list, description="Nodes gaining antidote awareness at this step")


class SimulationRunRequest(BaseModel):
    """Request payload to simulate rumour propagation and antidote spread."""
    nodes: List[Node] = Field(..., description="Network nodes")
    edges: List[Edge] = Field(..., description="Network edges")
    source: int = Field(..., description="Node ID that starts spreading the rumour")
    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Transmission probability per edge per time step (0.0 to 1.0)"
    )
    interventions: List[int] = Field(
        default_factory=list,
        description="List of node IDs selected for containment intervention"
    )
    budget: Optional[int] = Field(
        default=None,
        ge=0,
        description="Optional active intervention budget constraint"
    )
    intervention_details: Optional[List[InterventionDetail]] = Field(
        default=None,
        description="Detailed intervention types per node ('isolate', 'warn', 'fact_check', 'community_alert')"
    )
    antidote_sources: List[int] = Field(
        default_factory=list,
        description="List of node IDs initiating Antidote corrective information"
    )
    antidote_probability: float = Field(
        default=0.4,
        ge=0.0,
        le=1.0,
        description="Transmission probability per edge for Antidote correction"
    )
    seed: Optional[int] = Field(
        default=None,
        description="Optional random seed for reproducible simulation"
    )
    max_steps: int = Field(
        default=50,
        ge=1,
        le=200,
        description="Safety ceiling on discrete propagation steps"
    )


class SimulationRunResponse(BaseModel):
    """Structured response from a rumour and antidote propagation simulation."""
    source: int = Field(..., description="Initial rumour source node ID")
    interventions: List[int] = Field(..., description="Nodes subjected to containment intervention")
    spread_history: List[SpreadStep] = Field(..., description="Step-by-step progression of the rumour and antidote")
    final_reach: int = Field(..., description="Total number of users exposed/active at the end")
    antidote_reach: int = Field(default=0, description="Total users aware of Antidote correction")
    final_node_states: Dict[str, NodeState] = Field(
        ...,
        description="Mapping from string node ID to final NodeState"
    )
    antidote_states: Dict[str, str] = Field(
        default_factory=dict,
        description="Mapping from string node ID to Antidote awareness ('aware' / 'unaware')"
    )
    steps_taken: int = Field(..., description="Number of time steps until propagation ceased")
    total_nodes: int = Field(..., description="Total nodes in the network")


# ==============================================================================
# Strategy & Experiment Schemas (Person 2)
# ==============================================================================

class StrategyType(str, Enum):
    """Supported intervention strategies."""
    NONE = "none"
    RANDOM = "random"
    HIGHEST_DEGREE = "highest_degree"
    GREEDY = "greedy"


class StrategyMetrics(BaseModel):
    """Measured performance metrics for a specific intervention strategy."""
    strategy_name: str = Field(..., description="Identifier name of the strategy")
    selected_nodes: List[int] = Field(..., description="Nodes selected for intervention")
    average_final_reach: float = Field(..., description="Mean final reach across repeated trials")
    standard_deviation: float = Field(..., description="Standard deviation of final reach across trials")
    reduction_percentage: float = Field(
        ...,
        description="Spread reduction percentage relative to baseline: ((E0 - Es) / E0) * 100"
    )
    intervention_count: int = Field(..., description="Number of nodes intervened upon")
    execution_time: float = Field(..., description="Strategy evaluation duration in seconds")


class InterventionCompareRequest(BaseModel):
    """Request payload to benchmark and compare multiple intervention strategies."""
    nodes: List[Node] = Field(..., description="Network nodes")
    edges: List[Edge] = Field(..., description="Network edges")
    source: int = Field(..., description="Initial rumour source node ID")
    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Transmission probability per edge per time step (0.0 to 1.0)"
    )
    budget: int = Field(
        ...,
        ge=0,
        description="Maximum number of users that can be selected for intervention"
    )
    num_runs: int = Field(
        default=25,
        ge=1,
        le=500,
        description="Number of repeated simulation trials to average over"
    )
    seed: Optional[int] = Field(
        default=None,
        description="Optional seed for deterministic benchmarking"
    )


class InterventionCompareResponse(BaseModel):
    """Comprehensive comparison report across all intervention strategies."""
    baseline_reach: float = Field(..., description="Average reach under No Intervention baseline")
    budget: int = Field(..., description="Applied intervention budget")
    num_runs: int = Field(..., description="Number of simulation trials per strategy")
    strategies: Dict[str, StrategyMetrics] = Field(
        ...,
        description="Dictionary mapping strategy key to StrategyMetrics"
    )
    best_strategy: str = Field(..., description="Name of the strategy achieving highest reduction")
    summary: str = Field(..., description="Human-readable comparative summary")


# ==============================================================================
# Health Check Schema
# ==============================================================================

class HealthResponse(BaseModel):
    """Health check endpoint status response."""
    status: str = Field(default="ok", description="Service health status")
    app: str = Field(default="Spotted.", description="Application name")
    version: str = Field(default="0.1.0", description="Application version")
