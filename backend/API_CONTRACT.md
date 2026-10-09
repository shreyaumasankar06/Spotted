# Spotted. — API Contract & Module Specifications

This document defines the formal interfaces, data types, node-state semantics, and endpoint specifications for **Spotted.** (A Rumour Containment Simulator). Both developers must adhere strictly to these contracts so backend modules and frontend integration remain compatible without coordination overhead.

---

## 1. Node State Semantics

During simulation, every node in the social network has one of three mutually exclusive states:

| State | Value | Semantics & Transition Rules |
| :--- | :--- | :--- |
| **Unaware** | `"unaware"` | Node has not encountered the rumour. Can transition to `active` if a neighbour successfully transmits the rumour. |
| **Active** | `"active"` | Node is infected and actively transmits the rumour to unaware neighbours in subsequent discrete time steps. (The initial source begins in this state). |
| **Contained** | `"contained"` | Node has been intervened upon prior to rumour start. **Contained nodes can never become active and never transmit rumours.** They act as firewalls. |

---

## 2. Intervention Policy

To maintain scientific rigor and avoid edge-case ambiguities:

1. **Timing of Intervention:** Interventions are preventative. Selected nodes transition to `contained` at step 0 before rumour spread commences.
2. **Initial Source Immunity:** **The initial rumour source CANNOT be intervened upon.** If an API client or strategy attempts to include the source in the intervention list, it is automatically excluded.
3. **Budget Constraint:** A strategy cannot select more nodes than `budget` ($k$). If $k \ge |V| - 1$, all eligible nodes are contained.
4. **Target Validity:** Only nodes currently existing in the network are eligible for intervention.

---

## 3. Endpoints Overview

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description | Assigned Owner |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | Shared Integration |
| `POST` | `/api/network/generate` | Generate synthetic social network | Person 1 |
| `POST` | `/api/simulation/run` | Simulate rumour propagation step-by-step | Person 1 |
| `POST` | `/api/interventions/compare` | Benchmark baseline and greedy strategies | Person 2 |

---

## 4. Endpoint Specifications

### 4.1 Health Check

- **Method:** `GET`
- **Path:** `/api/health`
- **Request Body:** None

#### Response (200 OK)
```json
{
  "status": "ok",
  "app": "Spotted.",
  "version": "0.1.0"
}
```

---

### 4.2 Network Generation

- **Method:** `POST`
- **Path:** `/api/network/generate`
- **Module Owner:** Person 1 (`backend/network_generator.py`)

#### Request Payload
```json
{
  "num_users": 50,
  "seed": 42
}
```

| Field | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `num_users` | integer | No (Default: 50) | $5 \le \text{num\_users} \le 1000$ | Number of nodes in synthetic network |
| `seed` | integer / null | No (Default: null) | Any integer | Seed for deterministic generation |

#### Response (200 OK)
```json
{
  "network": {
    "nodes": [
      { "id": 0, "label": "User 0", "state": "unaware", "community": 0, "degree": 4 },
      { "id": 1, "label": "User 1", "state": "unaware", "community": 0, "degree": 5 }
    ],
    "edges": [
      { "source": 0, "target": 1 },
      { "source": 1, "target": 2 }
    ],
    "num_nodes": 50,
    "num_edges": 112
  },
  "suggested_source": 1,
  "message": "Network generated successfully"
}
```

---

### 4.3 Simulation Run

- **Method:** `POST`
- **Path:** `/api/simulation/run`
- **Module Owner:** Person 1 (`backend/spread_simulator.py`)

#### Request Payload
```json
{
  "nodes": [
    { "id": 0, "label": "User 0", "state": "unaware", "community": 0, "degree": 4, "speed": 1.0, "reliability": 85.0 },
    { "id": 1, "label": "User 1", "state": "unaware", "community": 0, "degree": 5, "speed": 0.8, "reliability": 40.0 }
  ],
  "edges": [
    { "source": 0, "target": 1 }
  ],
  "source": 0,
  "probability": 0.35,
  "interventions": [1],
  "intervention_details": [
    { "node_id": 1, "type": "fact_check" }
  ],
  "antidote_sources": [1],
  "antidote_probability": 0.4,
  "seed": 100,
  "max_steps": 50
}
```

| Field | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `nodes` | array[Node] | Yes | $\ge 2$ nodes | Network nodes list with `speed` and `reliability` |
| `edges` | array[Edge] | Yes | $\ge 1$ edge | Network edges list |
| `source` | integer | Yes | Must exist in `nodes` | Initial node starting the rumour |
| `probability`| float | Yes | $0.0 \le p \le 1.0$ | Base probability of transmission per connected edge per step |
| `interventions`| array[int] | No (Default: []) | Valid node IDs, $\ne \text{source}$ | Contained nodes list |
| `intervention_details`| array[InterventionDetail] | No (Default: null) | Valid node IDs | Multi-type intervention configurations (`isolate`, `warn`, `fact_check`, `community_alert`) |
| `antidote_sources`| array[int] | No (Default: []) | Valid node IDs | Node IDs starting corrective Antidote spread |
| `antidote_probability`| float | No (Default: 0.4) | $0.0 \le p \le 1.0$ | Transmission probability for Antidote spread |
| `seed` | integer / null | No (Default: null) | Any integer | Seed for reproducible simulation run |
| `max_steps` | integer | No (Default: 50) | $1 \le \text{max\_steps} \le 200$ | Safety ceiling on discrete propagation steps |

#### Response (200 OK)
```json
{
  "source": 0,
  "interventions": [1],
  "spread_history": [
    {
      "step": 0,
      "active_count": 1,
      "contained_count": 1,
      "unaware_count": 48,
      "antidote_count": 1,
      "newly_infected": [0],
      "newly_corrected": [1]
    },
    {
      "step": 1,
      "active_count": 3,
      "contained_count": 1,
      "unaware_count": 46,
      "antidote_count": 2,
      "newly_infected": [4, 7],
      "newly_corrected": [2]
    }
  ],
  "final_reach": 3,
  "antidote_reach": 2,
  "final_node_states": {
    "0": "active",
    "1": "contained",
    "2": "unaware"
  },
  "antidote_states": {
    "1": "aware",
    "2": "aware"
  },
  "steps_taken": 2,
  "total_nodes": 50
}
```

---

### 4.4 Intervention Comparison

- **Method:** `POST`
- **Path:** `/api/interventions/compare`
- **Module Owner:** Person 2 (`backend/experiments.py`, `backend/strategies.py`)

#### Request Payload
```json
{
  "nodes": [...],
  "edges": [...],
  "source": 0,
  "probability": 0.3,
  "budget": 3,
  "num_runs": 25,
  "seed": 42
}
```

| Field | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `nodes` | array[Node] | Yes | $\ge 2$ nodes | Network nodes |
| `edges` | array[Edge] | Yes | $\ge 1$ edge | Network edges |
| `source` | integer | Yes | Must exist in `nodes` | Rumour origin |
| `probability`| float | Yes | $0.0 \le p \le 1.0$ | Edge spreading probability |
| `budget` | integer | Yes | $0 \le \text{budget} < |V|$ | Max nodes to contain |
| `num_runs` | integer | No (Default: 25) | $1 \le \text{num\_runs} \le 500$ | Number of repeated trials |
| `seed` | integer / null | No (Default: null) | Any integer | Random seed for trials |

#### Response (200 OK)
```json
{
  "baseline_reach": 28.4,
  "budget": 3,
  "num_runs": 25,
  "strategies": {
    "none": {
      "strategy_name": "No Intervention",
      "selected_nodes": [],
      "average_final_reach": 28.4,
      "standard_deviation": 3.12,
      "reduction_percentage": 0.0,
      "intervention_count": 0,
      "execution_time": 0.04
    },
    "random": {
      "strategy_name": "Random Selection",
      "selected_nodes": [12, 34, 45],
      "average_final_reach": 24.1,
      "standard_deviation": 2.85,
      "reduction_percentage": 15.14,
      "intervention_count": 3,
      "execution_time": 0.045
    },
    "highest_degree": {
      "strategy_name": "Highest-Degree Selection",
      "selected_nodes": [1, 5, 9],
      "average_final_reach": 18.2,
      "standard_deviation": 2.1,
      "reduction_percentage": 35.92,
      "intervention_count": 3,
      "execution_time": 0.043
    },
    "greedy": {
      "strategy_name": "Greedy Optimization",
      "selected_nodes": [1, 14, 22],
      "average_final_reach": 12.6,
      "standard_deviation": 1.74,
      "reduction_percentage": 55.63,
      "intervention_count": 3,
      "execution_time": 0.18
    }
  },
  "best_strategy": "Greedy Optimization",
  "summary": "Greedy Optimization achieved the lowest average reach (12.60 users, 55.6% reduction)."
}
```

---

## 5. Module Responsibilities & Internal Python Signatures

### Person 1: Network & Simulation

#### `backend/network_generator.py`
```python
def generate_network(
    num_users: int = 50,
    seed: int | None = None
) -> tuple[nx.Graph, dict]:
    """Generates a synthetic social network with realistic community structure.
    
    Returns:
        tuple[nx.Graph, dict]: (NetworkX Graph instance, GraphData dict ready for Pydantic).
    """

def graph_to_dict(graph: nx.Graph) -> dict:
    """Serializes a NetworkX graph into the dict format compatible with GraphData."""

def dict_to_graph(nodes: list[dict], edges: list[dict]) -> nx.Graph:
    """Deserializes dict representations of nodes and edges into a NetworkX Graph."""
```

#### `backend/spread_simulator.py`
```python
def simulate_spread(
    graph: nx.Graph,
    source: int,
    probability: float,
    interventions: set[int] | list[int] | None = None,
    seed: int | None = None,
    max_steps: int = 50
) -> dict:
    """Simulates rumour propagation across discrete time steps.
    
    Rules:
    - Step 0: source becomes active, interventions become contained.
    - Step t -> t+1: each active node attempts to infect each unaware neighbour with probability p.
    - Synchronous update: nodes infected during step t only spread at step t+1.
    - Contained nodes never become active.
    
    Returns:
        dict: matches SimulationRunResponse schema.
    """
```

---

### Person 2: Strategies & Experiments

#### `backend/strategies.py`
```python
def select_random_nodes(
    graph: nx.Graph,
    budget: int,
    exclude: set[int] | None = None,
    seed: int | None = None
) -> list[int]:
    """Randomly selects up to `budget` valid nodes, excluding `exclude`."""

def select_highest_degree_nodes(
    graph: nx.Graph,
    budget: int,
    exclude: set[int] | None = None
) -> list[int]:
    """Selects top `budget` nodes with largest degree, excluding `exclude`."""

def select_greedy_nodes(
    graph: nx.Graph,
    budget: int,
    source: int,
    probability: float,
    evaluation_runs: int = 5,
    seed: int | None = None
) -> list[int]:
    """Iteratively selects nodes maximizing marginal spread reduction over `evaluation_runs`.
    
    Recalculates marginal benefit for remaining candidates at each iteration step.
    """
```

#### `backend/experiments.py`
```python
def compare_strategies(
    graph: nx.Graph,
    source: int,
    probability: float,
    budget: int,
    num_runs: int = 25,
    seed: int | None = None
) -> dict:
    """Runs repeated simulation trials comparing No Intervention, Random, Highest Degree, and Greedy.
    
    Computes average reach, standard deviation, spread reduction %, and execution time.
    Returns dict matching InterventionCompareResponse.
    """
```

---

## 6. Error Handling

Standard HTTP error status codes:
- `400 Bad Request`: Invalid parameters (e.g., source not in graph, empty graph).
- `422 Unprocessable Entity`: Schema validation failure by Pydantic.
- `500 Internal Server Error`: Unexpected runtime failure.
- `501 Not Implemented`: Endpoint method not yet wired up.
