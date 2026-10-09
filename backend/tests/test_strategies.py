"""Unit tests for strategies.py (Person 2)"""

import pytest
import networkx as nx
from network_generator import generate_network
from strategies import (
    select_random_nodes,
    select_highest_degree_nodes,
    select_greedy_nodes
)
from experiments import compare_strategies


@pytest.fixture
def sample_graph():
    """Create reproducible test graph with 25 nodes."""
    g, _ = generate_network(num_users=25, seed=123)
    return g


def test_intervention_targets_exist_in_graph(sample_graph):
    """Ensure all selected targets are valid existing nodes."""
    for fn in [
        lambda: select_random_nodes(sample_graph, budget=4, seed=1),
        lambda: select_highest_degree_nodes(sample_graph, budget=4),
        lambda: select_greedy_nodes(sample_graph, budget=4, source=0, probability=0.3, evaluation_runs=3, seed=1)
    ]:
        targets = fn()
        for node in targets:
            assert node in sample_graph


def test_intervention_targets_are_unique(sample_graph):
    """Ensure selected targets contain no duplicates."""
    for fn in [
        lambda: select_random_nodes(sample_graph, budget=5, seed=2),
        lambda: select_highest_degree_nodes(sample_graph, budget=5),
        lambda: select_greedy_nodes(sample_graph, budget=5, source=0, probability=0.35, evaluation_runs=3, seed=2)
    ]:
        targets = fn()
        assert len(targets) == len(set(targets))


def test_strategies_respect_budget(sample_graph):
    """Ensure strategies return at most budget items."""
    for budget in [0, 1, 3, 7]:
        r = select_random_nodes(sample_graph, budget=budget, seed=42)
        h = select_highest_degree_nodes(sample_graph, budget=budget)
        g = select_greedy_nodes(sample_graph, budget=budget, source=1, probability=0.3, evaluation_runs=2, seed=42)

        assert len(r) == budget
        assert len(h) == budget
        assert len(g) == budget


def test_budget_exceeding_eligible_users_handled_safely(sample_graph):
    """When budget exceeds eligible nodes, should return all eligible nodes without error."""
    large_budget = sample_graph.number_of_nodes() + 50
    exclude = {0}
    r = select_random_nodes(sample_graph, budget=large_budget, exclude=exclude, seed=42)
    h = select_highest_degree_nodes(sample_graph, budget=large_budget, exclude=exclude)
    g = select_greedy_nodes(sample_graph, budget=large_budget, source=0, probability=0.3, evaluation_runs=2)

    eligible_count = sample_graph.number_of_nodes() - 1
    assert len(r) == eligible_count
    assert len(h) == eligible_count
    assert len(g) == eligible_count
    assert 0 not in r
    assert 0 not in h
    assert 0 not in g


def test_initial_source_policy_applied_consistently(sample_graph):
    """The initial source node must never be chosen by any strategy."""
    source_node = 0
    exclude = {source_node}

    r = select_random_nodes(sample_graph, budget=4, exclude=exclude, seed=99)
    h = select_highest_degree_nodes(sample_graph, budget=4, exclude=exclude)
    g = select_greedy_nodes(sample_graph, budget=4, source=source_node, probability=0.4, evaluation_runs=3, seed=99)

    assert source_node not in r
    assert source_node not in h
    assert source_node not in g


def test_highest_degree_strategy_picks_max_degrees(sample_graph):
    """Highest-degree strategy should select nodes with largest degrees."""
    targets = select_highest_degree_nodes(sample_graph, budget=3, exclude={0})
    target_degrees = [sample_graph.degree(n) for n in targets]

    # Non-selected eligible nodes must not have degree strictly greater than chosen
    non_selected = set(sample_graph.nodes()) - set(targets) - {0}
    min_selected_deg = min(target_degrees)
    for n in non_selected:
        assert sample_graph.degree(n) <= min_selected_deg or sample_graph.degree(n) in target_degrees


def test_experiment_comparison_structure(sample_graph):
    """Verify compare_strategies returns structured report with valid metrics."""
    res = compare_strategies(
        graph=sample_graph,
        source=0,
        probability=0.35,
        budget=3,
        num_runs=5,
        seed=42
    )
    assert "baseline_reach" in res
    assert "strategies" in res
    assert "best_strategy" in res
    assert set(res["strategies"].keys()) == {"none", "random", "highest_degree", "greedy"}

    for key, metrics in res["strategies"].items():
        assert "average_final_reach" in metrics
        assert "standard_deviation" in metrics
        assert "reduction_percentage" in metrics
        assert "execution_time" in metrics
        assert metrics["average_final_reach"] >= 1.0
