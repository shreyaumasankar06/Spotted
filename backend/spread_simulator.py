"""Spread Simulator Module for Spotted. (Person 1)

Simulates probabilistic rumour propagation over discrete time steps using
synchronous Independent Cascade dynamics.
Maintains clear node-state semantics: unaware, active, and contained.
"""

from typing import Optional, Set, List, Dict, Any, Union
import random
import networkx as nx


def simulate_spread(
    graph: nx.Graph,
    source: int,
    probability: float,
    interventions: Optional[Union[Set[int], List[int]]] = None,
    seed: Optional[int] = None,
    max_steps: int = 50
) -> Dict[str, Any]:
    """Simulate rumour propagation over discrete time steps on a graph.
    
    Node states:
      - unaware: Has not encountered the rumour.
      - active: Exposed and informed with the rumour.
      - contained: Intervened upon prior to spread; cannot contract or transmit rumour.

    Intervention Policy:
      - Preventative: Interventions take effect at step 0 before rumour spread begins.
      - Source Immunity: The initial source cannot be intervened upon. If present
        in interventions, it is automatically excluded.
      - Contained nodes act as barriers/firewalls.

    Synchronous Dynamics:
      - Users newly exposed during step t begin spreading only on step t + 1.
      - Transmission attempts occur independently across edges with given probability.
      - Propagation ceases when no newly infected nodes are produced or max_steps reached.
      
    Args:
        graph: NetworkX undirected Graph representing the social network.
        source: Node ID that initiates the rumour.
        probability: Spreading probability per edge per step (0.0 to 1.0).
        interventions: Optional set or list of node IDs targeted for containment.
        seed: Optional random seed for reproducible simulation.
        max_steps: Maximum discrete steps to simulate.
        
    Returns:
        Dict[str, Any]: Structured simulation result matching SimulationRunResponse schema.
        
    Raises:
        ValueError: If source is not in graph or probability is out of bounds [0.0, 1.0].
    """
    if source not in graph:
        raise ValueError(f"Source node {source} does not exist in graph.")
    if not (0.0 <= probability <= 1.0):
        raise ValueError(f"Spreading probability must be between 0.0 and 1.0, got {probability}")

    rng = random.Random(seed)
    total_nodes = graph.number_of_nodes()

    # Normalize intervention set, strictly enforcing that initial source cannot be contained
    raw_interventions = set(interventions) if interventions else set()
    valid_interventions = {n for n in raw_interventions if n in graph and n != source}

    # Initialize node states
    node_states: Dict[int, str] = {}
    for node in graph.nodes():
        if node == source:
            node_states[node] = "active"
        elif node in valid_interventions:
            node_states[node] = "contained"
        else:
            node_states[node] = "unaware"

    # Active informed nodes (cumulative reach)
    active_nodes: Set[int] = {source}
    current_spreaders: Set[int] = {source}

    spread_history: List[Dict[str, Any]] = []

    # Step 0 snapshot
    spread_history.append({
        "step": 0,
        "active_count": len(active_nodes),
        "contained_count": len(valid_interventions),
        "unaware_count": total_nodes - len(active_nodes) - len(valid_interventions),
        "newly_infected": [source]
    })

    step = 0
    while current_spreaders and step < max_steps:
        step += 1
        newly_infected_step: Set[int] = set()

        # Each current spreader attempts to transmit to its unaware neighbours
        # Use sorted order for deterministic behavior with fixed seed
        for spreader in sorted(current_spreaders):
            for neighbour in sorted(graph.neighbors(spreader)):
                # Only unaware nodes can be infected (contained and active are immune)
                if node_states[neighbour] == "unaware":
                    if probability >= 1.0 or (probability > 0.0 and rng.random() < probability):
                        newly_infected_step.add(neighbour)

        # Synchronous transition for newly infected users
        for node in newly_infected_step:
            node_states[node] = "active"
            active_nodes.add(node)

        spread_history.append({
            "step": step,
            "active_count": len(active_nodes),
            "contained_count": len(valid_interventions),
            "unaware_count": total_nodes - len(active_nodes) - len(valid_interventions),
            "newly_infected": sorted(list(newly_infected_step))
        })

        # Newly exposed users become the spreaders for the subsequent step
        current_spreaders = newly_infected_step

    return {
        "source": source,
        "interventions": sorted(list(valid_interventions)),
        "spread_history": spread_history,
        "final_reach": len(active_nodes),
        "final_node_states": {str(n): state for n, state in node_states.items()},
        "steps_taken": step,
        "total_nodes": total_nodes
    }
