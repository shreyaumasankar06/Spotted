"""Unit tests for Pass 2 requirements: topology stability, regeneration, and strict budget enforcement."""

import pytest
import networkx as nx
from spread_simulator import simulate_spread
from network_generator import generate_network
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


@pytest.fixture
def test_network():
    """Create a fixed test network with 20 nodes."""
    g, dict_data = generate_network(num_users=20, seed=42)
    return g, dict_data


def test_topology_stability_during_inspection_and_simulation(test_network):
    """Inspecting nodes or running simulations on a fixed graph must NOT alter topology."""
    graph, dict_data = test_network
    initial_nodes = list(graph.nodes())
    initial_edges = sorted(list(graph.edges()))

    # Run simulation with no intervention
    res1 = simulate_spread(graph, source=0, probability=0.5, seed=10)
    assert sorted(list(graph.nodes())) == initial_nodes
    assert sorted(list(graph.edges())) == initial_edges

    # Run simulation with intervention on node 5
    res2 = simulate_spread(graph, source=0, probability=0.5, interventions=[5], seed=10)
    assert sorted(list(graph.nodes())) == initial_nodes
    assert sorted(list(graph.edges())) == initial_edges

    # Verify nodes and edges count unchanged
    assert dict_data["num_nodes"] == 20
    assert len(dict_data["edges"]) == len(initial_edges)


def test_repeated_topology_regeneration_creates_new_graphs():
    """Explicitly regenerating topology with new seeds must generate genuinely different graphs."""
    g1, dict1 = generate_network(num_users=20, seed=100)
    g2, dict2 = generate_network(num_users=20, seed=200)

    # Edge sets between different topology seeds must differ
    edges1 = {(e["source"], e["target"]) for e in dict1["edges"]}
    edges2 = {(e["source"], e["target"]) for e in dict2["edges"]}

    assert g1.number_of_nodes() == g2.number_of_nodes() == 20
    assert edges1 != edges2


def test_budget_exhaustion_prevents_exceeding_k(test_network):
    """Attempting to select more than budget (k) nodes must raise ValueError in simulator."""
    graph, _ = test_network
    budget = 2

    # Valid request within budget
    res_valid = simulate_spread(graph, source=0, probability=0.4, interventions=[1, 2], budget=budget, seed=42)
    assert len(res_valid["interventions"]) == 2

    # Invalid request exceeding budget (3 nodes when budget is 2)
    with pytest.raises(ValueError) as excinfo:
        simulate_spread(graph, source=0, probability=0.4, interventions=[1, 2, 3], budget=budget, seed=42)

    assert "exceeds budget limit of 2" in str(excinfo.value)


def test_rejection_of_duplicate_selections(test_network):
    """Passing duplicate intervention targets must be rejected."""
    graph, _ = test_network

    with pytest.raises(ValueError) as excinfo:
        simulate_spread(graph, source=0, probability=0.4, interventions=[2, 2, 3], budget=3, seed=42)

    assert "Duplicate intervention targets" in str(excinfo.value)


def test_direct_api_request_exceeding_budget_rejected(test_network):
    """Direct API POST request to /api/simulation/run exceeding budget must return 400 Bad Request."""
    _, dict_data = test_network

    payload = {
        "nodes": dict_data["nodes"],
        "edges": dict_data["edges"],
        "source": 0,
        "probability": 0.4,
        "interventions": [1, 2, 3],  # 3 nodes
        "budget": 2,                 # Budget is 2
        "seed": 42
    }

    response = client.post("/api/simulation/run", json=payload)
    assert response.status_code == 400
    assert "exceeds budget limit" in response.json()["detail"]
