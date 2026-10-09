"""Experiments & Strategy Benchmarking Module for Spotted. (Person 2)

Evaluates and compares rumour containment intervention strategies across repeated
probabilistic simulation trials under identical network conditions.
"""

from typing import Optional, Dict, Any, List
import time
import math
import numpy as np
import networkx as nx

from spread_simulator import simulate_spread
from strategies import (
    select_random_nodes,
    select_highest_degree_nodes,
    select_greedy_nodes
)


def run_trials(
    graph: nx.Graph,
    source: int,
    probability: float,
    interventions: List[int],
    num_runs: int,
    base_seed: int
) -> tuple[float, float]:
    """Run repeated simulation trials for a given intervention set and compute stats.
    
    Args:
        graph: NetworkX graph.
        source: Initial rumour source.
        probability: Spreading probability.
        interventions: Target nodes to contain.
        num_runs: Number of simulation trials.
        base_seed: Base seed for reproducible trial seeds.
        
    Returns:
        tuple[float, float]: (mean final reach, standard deviation of final reach)
    """
    reaches = []
    for i in range(num_runs):
        trial_seed = (base_seed + (i * 37)) & 0x7FFFFFFF
        sim = simulate_spread(
            graph=graph,
            source=source,
            probability=probability,
            interventions=set(interventions),
            seed=trial_seed
        )
        reaches.append(sim["final_reach"])

    reaches_arr = np.array(reaches, dtype=float)
    mean_val = float(np.mean(reaches_arr))
    std_val = float(np.std(reaches_arr, ddof=0 if len(reaches) <= 1 else 1))
    return round(mean_val, 2), round(std_val, 2)


def compare_strategies(
    graph: nx.Graph,
    source: int,
    probability: float,
    budget: int,
    num_runs: int = 25,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """Compare no intervention against all baseline and optimized intervention strategies.
    
    Evaluates:
      1. No Intervention (baseline)
      2. Random Selection
      3. Highest-Degree Selection
      4. Greedy Optimization
      
    Args:
        graph: NetworkX graph.
        source: Initial rumour source node ID.
        probability: Spreading probability per edge.
        budget: Maximum number of interventions.
        num_runs: Number of repeated simulation runs per strategy.
        seed: Optional seed for reproducible comparisons.
        
    Returns:
        Dict[str, Any]: Structured results conforming to InterventionCompareResponse schema.
    """
    base_seed = seed if seed is not None else 1000
    exclude = {source}

    strategies_result: Dict[str, Dict[str, Any]] = {}

    # 1. Baseline: No Intervention
    t0 = time.perf_counter()
    none_targets: List[int] = []
    none_mean, none_std = run_trials(
        graph=graph,
        source=source,
        probability=probability,
        interventions=none_targets,
        num_runs=num_runs,
        base_seed=base_seed
    )
    t_none = time.perf_counter() - t0

    baseline_reach = none_mean
    strategies_result["none"] = {
        "strategy_name": "No Intervention",
        "selected_nodes": none_targets,
        "average_final_reach": none_mean,
        "standard_deviation": none_std,
        "reduction_percentage": 0.0,
        "intervention_count": 0,
        "execution_time": round(t_none, 4)
    }

    # 2. Random Selection
    t0 = time.perf_counter()
    random_targets = select_random_nodes(
        graph=graph,
        budget=budget,
        exclude=exclude,
        seed=base_seed + 1
    )
    rand_mean, rand_std = run_trials(
        graph=graph,
        source=source,
        probability=probability,
        interventions=random_targets,
        num_runs=num_runs,
        base_seed=base_seed
    )
    t_rand = time.perf_counter() - t0

    rand_reduction = (
        round(((baseline_reach - rand_mean) / baseline_reach) * 100.0, 2)
        if baseline_reach > 0 else 0.0
    )
    strategies_result["random"] = {
        "strategy_name": "Random Selection",
        "selected_nodes": random_targets,
        "average_final_reach": rand_mean,
        "standard_deviation": rand_std,
        "reduction_percentage": rand_reduction,
        "intervention_count": len(random_targets),
        "execution_time": round(t_rand, 4)
    }

    # 3. Highest-Degree Selection
    t0 = time.perf_counter()
    degree_targets = select_highest_degree_nodes(
        graph=graph,
        budget=budget,
        exclude=exclude
    )
    deg_mean, deg_std = run_trials(
        graph=graph,
        source=source,
        probability=probability,
        interventions=degree_targets,
        num_runs=num_runs,
        base_seed=base_seed
    )
    t_deg = time.perf_counter() - t0

    deg_reduction = (
        round(((baseline_reach - deg_mean) / baseline_reach) * 100.0, 2)
        if baseline_reach > 0 else 0.0
    )
    strategies_result["highest_degree"] = {
        "strategy_name": "Highest-Degree Selection",
        "selected_nodes": degree_targets,
        "average_final_reach": deg_mean,
        "standard_deviation": deg_std,
        "reduction_percentage": deg_reduction,
        "intervention_count": len(degree_targets),
        "execution_time": round(t_deg, 4)
    }

    # 4. Greedy Optimization
    t0 = time.perf_counter()
    greedy_targets = select_greedy_nodes(
        graph=graph,
        budget=budget,
        source=source,
        probability=probability,
        evaluation_runs=max(3, min(10, num_runs // 2)),
        seed=base_seed + 2
    )
    greedy_mean, greedy_std = run_trials(
        graph=graph,
        source=source,
        probability=probability,
        interventions=greedy_targets,
        num_runs=num_runs,
        base_seed=base_seed
    )
    t_greedy = time.perf_counter() - t0

    greedy_reduction = (
        round(((baseline_reach - greedy_mean) / baseline_reach) * 100.0, 2)
        if baseline_reach > 0 else 0.0
    )
    strategies_result["greedy"] = {
        "strategy_name": "Greedy Optimization",
        "selected_nodes": greedy_targets,
        "average_final_reach": greedy_mean,
        "standard_deviation": greedy_std,
        "reduction_percentage": greedy_reduction,
        "intervention_count": len(greedy_targets),
        "execution_time": round(t_greedy, 4)
    }

    # Determine best performing strategy (lowest average reach)
    best_strat_key = min(strategies_result.keys(), key=lambda k: strategies_result[k]["average_final_reach"])
    best_name = strategies_result[best_strat_key]["strategy_name"]
    best_reach = strategies_result[best_strat_key]["average_final_reach"]
    best_reduc = strategies_result[best_strat_key]["reduction_percentage"]

    summary = (
        f"{best_name} achieved the best containment with average final reach of "
        f"{best_reach:.2f} users ({best_reduc:.1f}% reduction relative to baseline)."
    )

    return {
        "baseline_reach": baseline_reach,
        "budget": budget,
        "num_runs": num_runs,
        "strategies": strategies_result,
        "best_strategy": best_name,
        "summary": summary
    }
