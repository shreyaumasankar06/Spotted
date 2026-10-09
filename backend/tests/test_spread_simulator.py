"""Unit tests for spread_simulator.py (Person 1)"""

import pytest
import networkx as nx
from spread_simulator import simulate_spread
from network_generator import generate_network


@pytest.fixture
def sample_graph():
    """Create a reproducible test graph with 20 nodes."""
    g, _ = generate_network(num_users=20, seed=42)
    return g


def test_zero_probability_no_additional_spread(sample_graph):
    """Spreading probability of zero should only keep the initial source active."""
    res = simulate_spread(
        graph=sample_graph,
        source=0,
        probability=0.0,
        interventions=[],
        seed=1
    )
    assert res["final_reach"] == 1
    assert res["final_node_states"]["0"] == "active"
    for node_id, state in res["final_node_states"].items():
        if int(node_id) != 0:
            assert state == "unaware"


def test_initial_source_and_node_states(sample_graph):
    """Initial source and non-infected nodes must have correct states."""
    res = simulate_spread(
        graph=sample_graph,
        source=5,
        probability=0.5,
        interventions=[10, 12],
        seed=42
    )
    assert res["source"] == 5
    assert res["final_node_states"]["5"] == "active"
    assert res["final_node_states"]["10"] == "contained"
    assert res["final_node_states"]["12"] == "contained"
    assert 10 in res["interventions"]
    assert 12 in res["interventions"]


def test_intervention_policy_excludes_initial_source(sample_graph):
    """If initial source is provided in intervention set, it must be excluded."""
    res = simulate_spread(
        graph=sample_graph,
        source=3,
        probability=0.4,
        interventions=[3, 7],
        seed=99
    )
    # Source 3 must NOT be contained, must remain active
    assert 3 not in res["interventions"]
    assert res["final_node_states"]["3"] == "active"
    assert 7 in res["interventions"]
    assert res["final_node_states"]["7"] == "contained"


def test_contained_nodes_never_become_active(sample_graph):
    """Contained nodes must remain 'contained' even if connected to spreaders."""
    # Source 0 is connected to some neighbours; intervene on all neighbours of 0
    neighbours = list(sample_graph.neighbors(0))
    res = simulate_spread(
        graph=sample_graph,
        source=0,
        probability=1.0,  # 100% transmission probability
        interventions=neighbours,
        seed=42
    )
    # All neighbours should remain contained, preventing rumour from propagating through them
    for n in neighbours:
        assert res["final_node_states"][str(n)] == "contained"
    assert res["final_reach"] == 1


def test_results_contain_expected_fields(sample_graph):
    """Verify that returned dictionary conforms to expected schema."""
    res = simulate_spread(
        graph=sample_graph,
        source=1,
        probability=0.3,
        interventions=[4],
        seed=10
    )
    expected_keys = {
        "source", "interventions", "spread_history",
        "final_reach", "final_node_states", "steps_taken", "total_nodes"
    }
    assert expected_keys.issubset(res.keys())
    assert isinstance(res["spread_history"], list)
    assert len(res["spread_history"]) >= 1

    first_step = res["spread_history"][0]
    assert first_step["step"] == 0
    assert first_step["active_count"] == 1
    assert first_step["contained_count"] == 1


def test_fixed_seed_produces_reproducible_outcomes(sample_graph):
    """Simulation runs with identical seeds must yield identical histories and reaches."""
    res1 = simulate_spread(sample_graph, source=2, probability=0.45, seed=777)
    res2 = simulate_spread(sample_graph, source=2, probability=0.45, seed=777)

    assert res1["final_reach"] == res2["final_reach"]
    assert res1["steps_taken"] == res2["steps_taken"]
    assert res1["final_node_states"] == res2["final_node_states"]
    assert res1["spread_history"] == res2["spread_history"]
