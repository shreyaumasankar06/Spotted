"""Intervention Strategies Module for Spotted. (Person 2)

Implements baseline intervention algorithms (Random, Highest Degree) and an iterative
Greedy Intervention Optimizer that recalculates marginal containment benefit at every step.
"""

from typing import Optional, Set, List, Dict
import random
import networkx as nx
from spread_simulator import simulate_spread


def get_eligible_nodes(
    graph: nx.Graph,
    exclude: Optional[Set[int]] = None
) -> List[int]:
    """Retrieve all node IDs eligible for intervention (excluding specified nodes).
    
    Args:
        graph: NetworkX graph.
        exclude: Set of node IDs not eligible (e.g. initial rumour source).
        
    Returns:
        List[int]: Sorted list of eligible node IDs.
    """
    excluded_set = exclude or set()
    return [n for n in sorted(graph.nodes()) if n not in excluded_set]


def select_random_nodes(
    graph: nx.Graph,
    budget: int,
    exclude: Optional[Set[int]] = None,
    seed: Optional[int] = None
) -> List[int]:
    """Select random intervention targets within budget.
    
    Args:
        graph: NetworkX graph.
        budget: Maximum number of nodes to select.
        exclude: Nodes excluded from selection (e.g., initial source).
        seed: Optional random seed for reproducible selection.
        
    Returns:
        List[int]: Selected unique node IDs, sorted.
    """
    if budget <= 0:
        return []

    eligible = get_eligible_nodes(graph, exclude)
    if budget >= len(eligible):
        return eligible

    rng = random.Random(seed)
    return sorted(rng.sample(eligible, budget))


def select_highest_degree_nodes(
    graph: nx.Graph,
    budget: int,
    exclude: Optional[Set[int]] = None
) -> List[int]:
    """Select users with the highest degree (number of direct connections).
    
    Ties are broken consistently by ascending node ID.
    
    Args:
        graph: NetworkX graph.
        budget: Maximum number of nodes to select.
        exclude: Nodes excluded from selection (e.g., initial source).
        
    Returns:
        List[int]: Selected unique node IDs, sorted.
    """
    if budget <= 0:
        return []

    eligible = get_eligible_nodes(graph, exclude)
    if budget >= len(eligible):
        return eligible

    # Sort descending by degree, ascending by node ID for deterministic tie-breaking
    sorted_by_degree = sorted(eligible, key=lambda n: (-graph.degree(n), n))
    return sorted(sorted_by_degree[:budget])


def select_greedy_nodes(
    graph: nx.Graph,
    budget: int,
    source: int,
    probability: float,
    evaluation_runs: int = 5,
    seed: Optional[int] = None
) -> List[int]:
    """Select users iteratively based on estimated marginal reduction in rumour spread.
    
    The algorithm iteratively adds the single node that minimizes expected final reach
    when combined with already selected targets, recalculating marginal benefits at
    every step.
    
    Computational Trade-offs:
      - Full greedy evaluation on |V| candidates for k steps takes O(k * |V| * runs * |E|).
      - For responsiveness in interactive web applications, `evaluation_runs` defaults to 5.
      - Comparable seeds are reused across candidate evaluations per step to minimize Monte Carlo variance.
      - Never selects the initial rumour source.
      
    Args:
        graph: NetworkX graph.
        budget: Maximum number of nodes to select.
        source: Initial rumour source node ID (excluded from intervention).
        probability: Rumour spreading probability.
        evaluation_runs: Number of simulation trials used to estimate expected reach.
        seed: Optional random seed for reproducible evaluations.
        
    Returns:
        List[int]: Selected unique node IDs, sorted.
    """
    if budget <= 0:
        return []

    exclude = {source}
    eligible = set(get_eligible_nodes(graph, exclude))
    if budget >= len(eligible):
        return sorted(list(eligible))

    selected: List[int] = []
    base_seed = seed if seed is not None else 42

    for step_idx in range(budget):
        best_candidate: Optional[int] = None
        lowest_average_reach = float("inf")

        remaining_candidates = sorted(list(eligible - set(selected)))
        if not remaining_candidates:
            break

        # If probability is 0, marginal simulation is trivial (reach is always 1)
        if probability <= 0.0:
            # Fall back to degree or arbitrary candidate
            return sorted(selected + remaining_candidates[: budget - len(selected)])

        for candidate in remaining_candidates:
            test_interventions = set(selected) | {candidate}
            total_reach = 0

            # Evaluate over multiple simulation runs with fixed comparable seeds
            for run_i in range(evaluation_runs):
                trial_seed = (base_seed + (step_idx * 1000) + (run_i * 100)) & 0xFFFFFF
                result = simulate_spread(
                    graph=graph,
                    source=source,
                    probability=probability,
                    interventions=test_interventions,
                    seed=trial_seed
                )
                total_reach += result["final_reach"]

            avg_reach = total_reach / evaluation_runs

            if avg_reach < lowest_average_reach:
                lowest_average_reach = avg_reach
                best_candidate = candidate

        if best_candidate is not None:
            selected.append(best_candidate)

    return sorted(selected)
