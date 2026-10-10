"""Spread Simulator Module for Spotted.

Simulates stochastic rumour propagation and antidote spread over discrete time steps.
Includes node attributes (speed, reliability) and multi-type intervention controls:
isolate, warn, fact_check, and community_alert.
"""

from typing import Optional, Set, List, Dict, Any, Union
import random
import networkx as nx


def simulate_spread(
    graph: nx.Graph,
    source: int,
    probability: float,
    interventions: Optional[Union[Set[int], List[int]]] = None,
    budget: Optional[int] = None,
    intervention_details: Optional[List[Dict[str, Any]]] = None,
    antidote_sources: Optional[List[int]] = None,
    antidote_probability: Optional[float] = None,
    seed: Optional[int] = None,
    max_steps: int = 50
) -> Dict[str, Any]:
    """Simulate rumour propagation and corrective antidote spread over discrete time steps.
    
    Attributes & Mechanisms:
    1. Synchronous Dynamics: Newly exposed users in step t spread starting at step t+1.
    2. Node Speed: Fast nodes (speed >= 1.0) attempt transmission every step;
       slow nodes (speed < 1.0) attempt transmission with interval = round(1 / speed).
    3. Node Reliability: Perceived credibility R(u) in [0, 100] scales effective transmission
       credibility: Credibility_Multiplier = 0.5 + 0.5 * (R(u) / 100).
    4. Antidote Mechanism: Corrective information spreads independently from antidote sources.
       Reuses base spreading probability by default unless specifically overridden.
    5. Interventions & Budget:
       - Strictly enforces budget k. Rejects requests exceeding budget or containing duplicates.
       - 'isolate': Transmission probability set to 0. Node state = 'contained'.
       - 'warn': Forwarding probability scaled by 0.3.
       - 'fact_check': Forwarding probability set to 0 AND node becomes an Antidote source.
       - 'community_alert': Forwarding probability of all direct neighbours scaled by 0.5.
        
    Args:
        graph: NetworkX undirected Graph representing the social network.
        source: Node ID initiating the rumour.
        probability: Base spreading probability per edge per step (0.0 to 1.0).
        interventions: Optional list/set of node IDs selected for containment.
        budget: Optional maximum intervention budget constraint.
        intervention_details: Optional list of dicts with 'node_id' and 'type'.
        antidote_sources: Optional list of node IDs starting antidote spread.
        antidote_probability: Optional antidote spreading probability (defaults to rumour probability).
        seed: Optional random seed for reproducible simulation.
        max_steps: Maximum discrete steps to simulate.
        
    Returns:
        Dict[str, Any]: Structured simulation result matching SimulationRunResponse schema.
    """
    if source not in graph:
        raise ValueError(f"Source node {source} does not exist in graph.")
    if not (0.0 <= probability <= 1.0):
        raise ValueError(f"Spreading probability must be between 0.0 and 1.0, got {probability}")

    antidote_base_prob = antidote_probability if antidote_probability is not None else probability
    if not (0.0 <= antidote_base_prob <= 1.0):
        raise ValueError(f"Antidote probability must be between 0.0 and 1.0, got {antidote_base_prob}")

    # Check for duplicate targets in list representation
    if isinstance(interventions, list) and len(interventions) != len(set(interventions)):
        raise ValueError("Duplicate intervention targets detected in request.")

    rng = random.Random(seed)
    total_nodes = graph.number_of_nodes()

    # Normalize intervention set, strictly enforcing that initial source cannot be contained
    raw_interventions = set(interventions) if interventions else set()
    valid_interventions = {n for n in raw_interventions if n in graph and n != source}

    # Strict budget enforcement check
    if budget is not None and len(valid_interventions) > budget:
        raise ValueError(f"Intervention request ({len(valid_interventions)} nodes) exceeds budget limit of {budget}.")

    # Map intervention type per node ID ('isolate', 'warn', 'fact_check', 'community_alert')
    intervention_type_map: Dict[int, str] = {}
    if intervention_details:
        for detail in intervention_details:
            nid = detail.get("node_id") if isinstance(detail, dict) else getattr(detail, "node_id", None)
            itype = detail.get("type") if isinstance(detail, dict) else getattr(detail, "type", "isolate")
            if nid in graph and nid != source:
                intervention_type_map[nid] = itype
                valid_interventions.add(nid)
    else:
        for nid in valid_interventions:
            intervention_type_map[nid] = "isolate"

    # Identify nodes affected by community alert (neighbours of community_alert targets)
    community_alerted_nodes: Set[int] = set()
    for nid, itype in intervention_type_map.items():
        if itype == "community_alert":
            for nbr in graph.neighbors(nid):
                community_alerted_nodes.add(nbr)

    # Initialize Antidote sources
    antidote_sources_set: Set[int] = set(antidote_sources) if antidote_sources else set()
    # Fact-checked nodes automatically become Antidote sources
    for nid, itype in intervention_type_map.items():
        if itype == "fact_check":
            antidote_sources_set.add(nid)

    # Initialize Node States & Antidote States independently
    node_states: Dict[int, str] = {}
    antidote_states: Dict[int, str] = {}

    for node in graph.nodes():
        # Rumour State initialization
        if node == source:
            node_states[node] = "active"
        elif node in valid_interventions and intervention_type_map.get(node) in ("isolate", "fact_check"):
            node_states[node] = "contained"
        else:
            node_states[node] = "unaware"

        # Antidote State initialization
        if node in antidote_sources_set:
            antidote_states[node] = "aware"
        else:
            antidote_states[node] = "unaware"

    # Sets tracking active spreaders
    active_nodes: Set[int] = {source}
    antidote_aware_nodes: Set[int] = set(antidote_sources_set)

    spread_history: List[Dict[str, Any]] = []

    # Step 0 Snapshot
    contained_count = sum(1 for s in node_states.values() if s == "contained")
    spread_history.append({
        "step": 0,
        "active_count": len(active_nodes),
        "contained_count": contained_count,
        "unaware_count": total_nodes - len(active_nodes) - contained_count,
        "antidote_count": len(antidote_aware_nodes),
        "newly_infected": [source],
        "newly_corrected": sorted(list(antidote_sources_set))
    })

    # Active spreaders are nodes that can transmit to unaware neighbours
    # A node remains an active spreader in steps until attempts complete or neighbours are no longer unaware
    active_rumour_spreaders: Set[int] = {source}
    active_antidote_spreaders: Set[int] = set(antidote_sources_set)

    step = 0
    while (active_rumour_spreaders or active_antidote_spreaders) and step < max_steps:
        step += 1
        newly_infected_step: Set[int] = set()
        newly_corrected_step: Set[int] = set()

        # ----------------------------------------------------------------------
        # A. Antidote Propagation (Corrective Information Spread)
        # ----------------------------------------------------------------------
        for spreader in sorted(active_antidote_spreaders):
            spreader_data = graph.nodes[spreader]
            spreader_speed = spreader_data.get("speed", 1.0)
            spreader_rel = spreader_data.get("reliability", 50.0)

            # Node Speed Timing Rule: Interval in steps = max(1, round(1 / speed))
            interval = max(1, int(round(1.0 / spreader_speed))) if spreader_speed < 1.0 else 1
            if step % interval != 0 and step > 1:
                continue

            # Reliability Credibility Multiplier
            credibility_mult = 0.5 + 0.5 * (spreader_rel / 100.0)
            eff_antidote_prob = min(1.0, max(0.0, antidote_base_prob * credibility_mult))

            for nbr in sorted(graph.neighbors(spreader)):
                if antidote_states[nbr] == "unaware":
                    if eff_antidote_prob >= 1.0 or (eff_antidote_prob > 0.0 and rng.random() < eff_antidote_prob):
                        newly_corrected_step.add(nbr)

        # Apply Antidote state changes
        for node in newly_corrected_step:
            antidote_states[node] = "aware"
            antidote_aware_nodes.add(node)

        # ----------------------------------------------------------------------
        # B. Rumour Propagation (Misinformation Spread)
        # ----------------------------------------------------------------------
        for spreader in sorted(active_rumour_spreaders):
            spreader_data = graph.nodes[spreader]
            spreader_speed = spreader_data.get("speed", 1.0)
            spreader_rel = spreader_data.get("reliability", 50.0)

            # Node Speed Timing Rule
            interval = max(1, int(round(1.0 / spreader_speed))) if spreader_speed < 1.0 else 1
            if step % interval != 0 and step > 1:
                continue

            # Reliability Credibility Multiplier
            credibility_mult = 0.5 + 0.5 * (spreader_rel / 100.0)

            # Intervention Forwarding Multiplier
            itype = intervention_type_map.get(spreader)
            if itype in ("isolate", "fact_check"):
                intervention_mult = 0.0
            elif itype == "warn":
                intervention_mult = 0.3
            else:
                intervention_mult = 1.0

            for nbr in sorted(graph.neighbors(spreader)):
                if node_states[nbr] == "unaware":
                    # Community alert multiplier
                    comm_mult = 0.5 if (nbr in community_alerted_nodes or spreader in community_alerted_nodes) else 1.0

                    eff_rumour_prob = min(1.0, max(0.0, probability * credibility_mult * intervention_mult * comm_mult))

                    if eff_rumour_prob >= 1.0 or (eff_rumour_prob > 0.0 and rng.random() < eff_rumour_prob):
                        newly_infected_step.add(nbr)

        # Apply Rumour state changes
        for node in newly_infected_step:
            node_states[node] = "active"
            active_nodes.add(node)

        # Update step history
        contained_count = sum(1 for s in node_states.values() if s == "contained")
        spread_history.append({
            "step": step,
            "active_count": len(active_nodes),
            "contained_count": contained_count,
            "unaware_count": total_nodes - len(active_nodes) - contained_count,
            "antidote_count": len(antidote_aware_nodes),
            "newly_infected": sorted(list(newly_infected_step)),
            "newly_corrected": sorted(list(newly_corrected_step))
        })

        # Active spreaders for next step are nodes with remaining unaware neighbours
        active_rumour_spreaders = {
            n for n in active_nodes
            if any(node_states[nbr] == "unaware" for nbr in graph.neighbors(n))
        }
        active_antidote_spreaders = {
            n for n in antidote_aware_nodes
            if any(antidote_states[nbr] == "unaware" for nbr in graph.neighbors(n))
        }

    return {
        "source": source,
        "interventions": sorted(list(valid_interventions)),
        "spread_history": spread_history,
        "final_reach": len(active_nodes),
        "antidote_reach": len(antidote_aware_nodes),
        "final_node_states": {str(n): state for n, state in node_states.items()},
        "antidote_states": {str(n): state for n, state in antidote_states.items()},
        "steps_taken": step,
        "total_nodes": total_nodes
    }


def simulate_antidote_spread(
    graph: nx.Graph,
    source: int,
    probability: float,
    existing_antidote_states: Optional[Dict[str, str]] = None,
    seed: Optional[int] = None,
    max_steps: int = 50
) -> Dict[str, Any]:
    """Simulate probabilistic Antidote spread from a starting source node across network levels.

    Propagation Rules:
    1. The source node becomes correction-aware immediately.
    2. Transmission to immediate neighbours is probabilistic, using the exact same transmission
       probability logic and random-number generation mechanism as rumour propagation.
    3. Transmission succeeds if random() < P_eff, where:
       P_eff = min(1.0, max(0.0, probability * (0.5 + 0.5 * (spreader_reliability / 100.0)))).
    4. Successful neighbours become correction-aware and attempt to spread to their neighbours at the next level.
    5. Transmission is NOT guaranteed for all neighbours; some succeed and others fail.
    6. Stops when no further transmissions succeed or no eligible nodes remain.
    7. Already-aware nodes cannot receive repeatedly (preventing infinite loops).
    8. Preserves existing graph topology and edges.
    9. Does not erase existing rumour states; rumour exposure history is preserved.
    """
    if source not in graph:
        raise ValueError(f"Antidote source node {source} does not exist in graph.")
    if not (0.0 <= probability <= 1.0):
        raise ValueError(f"Spreading probability must be between 0.0 and 1.0, got {probability}")

    rng = random.Random(seed)
    total_nodes = graph.number_of_nodes()

    # Initialize antidote states
    antidote_states: Dict[int, str] = {}
    for node in graph.nodes():
        if existing_antidote_states:
            prev = existing_antidote_states.get(str(node), existing_antidote_states.get(node, "unaware"))
            antidote_states[node] = prev
        else:
            antidote_states[node] = "unaware"

    # Mark source node correction-aware immediately
    antidote_states[source] = "aware"

    history: List[Dict[str, Any]] = [{
        "step": 0,
        "newly_corrected": [source],
        "total_aware": sum(1 for s in antidote_states.values() if s == "aware")
    }]

    active_spreaders: Set[int] = {source}
    step = 0

    while active_spreaders and step < max_steps:
        step += 1
        newly_corrected_step: Set[int] = set()

        for spreader in sorted(active_spreaders):
            spreader_data = graph.nodes[spreader]
            spreader_speed = spreader_data.get("speed", 1.0)
            spreader_rel = spreader_data.get("reliability", 50.0)

            # Node Speed Timing Rule
            interval = max(1, int(round(1.0 / spreader_speed))) if spreader_speed < 1.0 else 1
            if step % interval != 0 and step > 1:
                continue

            # Reliability Credibility Multiplier (exact same logic as rumour simulator)
            credibility_mult = 0.5 + 0.5 * (spreader_rel / 100.0)
            eff_prob = min(1.0, max(0.0, probability * credibility_mult))

            for nbr in sorted(graph.neighbors(spreader)):
                if antidote_states[nbr] == "unaware":
                    # Determine whether transmission succeeds probabilistically
                    if eff_prob >= 1.0 or (eff_prob > 0.0 and rng.random() < eff_prob):
                        newly_corrected_step.add(nbr)

        # Mark newly corrected nodes as aware
        for node in newly_corrected_step:
            antidote_states[node] = "aware"

        if not newly_corrected_step:
            break

        history.append({
            "step": step,
            "newly_corrected": sorted(list(newly_corrected_step)),
            "total_aware": sum(1 for s in antidote_states.values() if s == "aware")
        })

        # Active spreaders for next level are newly corrected nodes that have unaware neighbours
        active_spreaders = {
            n for n in newly_corrected_step
            if any(antidote_states[nbr] == "unaware" for nbr in graph.neighbors(n))
        }

    all_aware_nodes = [n for n, s in antidote_states.items() if s == "aware"]

    return {
        "antidote_source": source,
        "antidote_states": {str(n): state for n, state in antidote_states.items()},
        "all_aware_nodes": sorted(all_aware_nodes),
        "history": history,
        "steps_taken": step,
        "total_aware": len(all_aware_nodes),
        "message": f"Antidote spread from User #{source} reached {len(all_aware_nodes)} total users."
    }

