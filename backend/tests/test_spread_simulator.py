"""Unit tests for spread_simulator.py (Person 1 & Part 3 requirements)"""

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
    """If initial source is provided in intervention set, it must be excluded from containment."""
    res = simulate_spread(
        graph=sample_graph,
        source=3,
        probability=0.4,
        interventions=[3, 7],
        seed=99
    )
    assert 3 not in res["interventions"]
    assert res["final_node_states"]["3"] == "active"
    assert 7 in res["interventions"]
    assert res["final_node_states"]["7"] == "contained"


def test_contained_nodes_never_become_active(sample_graph):
    """Contained nodes must remain 'contained' even if connected to spreaders."""
    neighbours = list(sample_graph.neighbors(0))
    res = simulate_spread(
        graph=sample_graph,
        source=0,
        probability=1.0,
        interventions=neighbours,
        seed=42
    )
    for n in neighbours:
        assert res["final_node_states"][str(n)] == "contained"
    assert res["final_reach"] == 1


def test_speed_effects_delay_transmission():
    """Slow nodes (speed < 1.0) should delay transmission compared to fast nodes."""
    g = nx.Graph()
    # Path graph: 0 - 1 - 2
    g.add_edge(0, 1)
    g.add_edge(1, 2)

    # Slow node 0 with speed 0.5 (attempts every 2 steps)
    g.add_node(0, speed=0.5, reliability=100.0)
    g.add_node(1, speed=1.0, reliability=100.0)
    g.add_node(2, speed=1.0, reliability=100.0)

    res = simulate_spread(g, source=0, probability=1.0, seed=42)
    assert res["final_reach"] == 3
    assert res["steps_taken"] >= 2


def test_reliability_effects_on_transmission():
    """Higher reliability increases effective transmission probability."""
    g = nx.Graph()
    # Star graph with center 0 and leaves 1..10
    for i in range(1, 11):
        g.add_edge(0, i)

    # High reliability node vs Low reliability node
    g.add_node(0, speed=1.0, reliability=100.0)
    for i in range(1, 11):
        g.add_node(i, speed=1.0, reliability=100.0)

    res_high = simulate_spread(g, source=0, probability=0.3, seed=123)

    g.nodes[0]["reliability"] = 0.0
    res_low = simulate_spread(g, source=0, probability=0.3, seed=123)

    # High reliability source achieves greater or equal reach than zero reliability source
    assert res_high["final_reach"] >= res_low["final_reach"]


def test_antidote_spreading():
    """Antidote should spread independently and be tracked in antidote_states and antidote_reach."""
    g = nx.Graph()
    # Path: 0 - 1 - 2 - 3
    g.add_edge(0, 1)
    g.add_edge(1, 2)
    g.add_edge(2, 3)
    for n in g.nodes():
        g.nodes[n]["speed"] = 1.0
        g.nodes[n]["reliability"] = 80.0

    res = simulate_spread(
        g,
        source=0,
        probability=0.0,  # Rumour doesn't spread
        antidote_sources=[3],
        antidote_probability=1.0,  # Antidote spreads 100%
        seed=42
    )

    assert res["antidote_reach"] == 4
    for n in g.nodes():
        assert res["antidote_states"][str(n)] == "aware"


def test_interventions_multi_type():
    """Verify isolate, warn, fact_check, and community_alert intervention types."""
    g = nx.Graph()
    g.add_edge(0, 1)
    g.add_edge(1, 2)
    g.add_edge(2, 3)
    for n in g.nodes():
        g.nodes[n]["speed"] = 1.0
        g.nodes[n]["reliability"] = 80.0

    # Fact-check intervention on node 1 makes node 1 an Antidote source
    details = [
        {"node_id": 1, "type": "fact_check"}
    ]

    res = simulate_spread(
        g,
        source=0,
        probability=1.0,
        intervention_details=details,
        antidote_probability=1.0,
        seed=42
    )

    # Node 1 is contained from rumour and spreads antidote to neighbours
    assert res["final_node_states"]["1"] == "contained"
    assert res["antidote_states"]["1"] == "aware"
    assert res["antidote_states"]["2"] == "aware"


def test_fixed_seed_produces_reproducible_outcomes(sample_graph):
    """Simulation runs with identical seeds must yield identical histories and reaches."""
    res1 = simulate_spread(sample_graph, source=2, probability=0.45, seed=777)
    res2 = simulate_spread(sample_graph, source=2, probability=0.45, seed=777)

    assert res1["final_reach"] == res2["final_reach"]
    assert res1["steps_taken"] == res2["steps_taken"]
    assert res1["final_node_states"] == res2["final_node_states"]
    assert res1["spread_history"] == res2["spread_history"]
