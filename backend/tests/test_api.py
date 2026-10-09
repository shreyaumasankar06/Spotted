"""Integration tests for FastAPI endpoints in main.py."""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check_endpoint():
    """Verify GET /api/health returns 200 OK and expected payload."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "Spotted."


def test_network_generate_endpoint():
    """Verify POST /api/network/generate generates a network."""
    response = client.post("/api/network/generate", json={"num_users": 20, "seed": 42})
    assert response.status_code == 200
    data = response.json()
    assert "network" in data
    assert data["network"]["num_nodes"] == 20
    assert "suggested_source" in data


def test_simulation_run_endpoint():
    """Verify POST /api/simulation/run executes rumour simulation."""
    # First generate network
    net_resp = client.post("/api/network/generate", json={"num_users": 15, "seed": 10})
    net_data = net_resp.json()["network"]
    source = net_resp.json()["suggested_source"]

    sim_payload = {
        "nodes": net_data["nodes"],
        "edges": net_data["edges"],
        "source": source,
        "probability": 0.4,
        "interventions": [],
        "seed": 99,
        "max_steps": 20
    }
    response = client.post("/api/simulation/run", json=sim_payload)
    assert response.status_code == 200
    sim_data = response.json()
    assert sim_data["source"] == source
    assert sim_data["final_reach"] >= 1
    assert len(sim_data["spread_history"]) >= 1


def test_intervention_compare_endpoint():
    """Verify POST /api/interventions/compare benchmarks all strategies."""
    net_resp = client.post("/api/network/generate", json={"num_users": 15, "seed": 15})
    net_data = net_resp.json()["network"]
    source = net_resp.json()["suggested_source"]

    compare_payload = {
        "nodes": net_data["nodes"],
        "edges": net_data["edges"],
        "source": source,
        "probability": 0.35,
        "budget": 2,
        "num_runs": 5,
        "seed": 50
    }
    response = client.post("/api/interventions/compare", json=compare_payload)
    assert response.status_code == 200
    comp_data = response.json()
    assert "baseline_reach" in comp_data
    assert "strategies" in comp_data
    assert "best_strategy" in comp_data
    assert "greedy" in comp_data["strategies"]
