"""Unit tests for network_generator.py (Person 1)"""

import pytest
import networkx as nx
from network_generator import generate_network, graph_to_dict, dict_to_graph


def test_requested_number_of_users_generated():
    """Verify that network generation produces exact requested number of users."""
    for n in [10, 25, 50, 100]:
        graph, data = generate_network(num_users=n, seed=42)
        assert graph.number_of_nodes() == n
        assert data["num_nodes"] == n
        assert len(data["nodes"]) == n
        assert nx.is_connected(graph)


def test_invalid_network_sizes_rejected():
    """Ensure invalid network sizes raise ValueError."""
    with pytest.raises(ValueError):
        generate_network(num_users=4)  # below minimum 5

    with pytest.raises(ValueError):
        generate_network(num_users=1001)  # above maximum 1000

    with pytest.raises(ValueError):
        generate_network(num_users=-10)


def test_fixed_seed_produces_reproducible_results():
    """Verify that two generations with the same seed produce identical graphs."""
    g1, d1 = generate_network(num_users=30, seed=123)
    g2, d2 = generate_network(num_users=30, seed=123)

    assert sorted(g1.edges()) == sorted(g2.edges())
    assert d1["num_edges"] == d2["num_edges"]
    assert d1["edges"] == d2["edges"]


def test_different_seeds_produce_different_graphs():
    """Verify that distinct seeds produce different edge configurations."""
    g1, _ = generate_network(num_users=40, seed=10)
    g2, _ = generate_network(num_users=40, seed=999)

    assert sorted(g1.edges()) != sorted(g2.edges())


def test_serialization_and_deserialization():
    """Test round-trip conversion between NetworkX graph and dict format."""
    orig_g, data = generate_network(num_users=20, seed=7)
    reconstructed_g = dict_to_graph(data["nodes"], data["edges"])

    assert reconstructed_g.number_of_nodes() == orig_g.number_of_nodes()
    assert reconstructed_g.number_of_edges() == orig_g.number_of_edges()
    assert sorted(reconstructed_g.edges()) == sorted(orig_g.edges())
