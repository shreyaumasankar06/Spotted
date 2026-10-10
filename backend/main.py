"""Main FastAPI Application for Spotted. — Rumour Containment Simulator

Exposes RESTful endpoints for network generation, rumour propagation simulation,
and multi-strategy containment benchmarking.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    HealthResponse,
    NetworkGenerateRequest,
    NetworkGenerateResponse,
    SimulationRunRequest,
    SimulationRunResponse,
    AntidoteSpreadRequest,
    AntidoteSpreadResponse,
    InterventionCompareRequest,
    InterventionCompareResponse,
)
from network_generator import generate_network, dict_to_graph
from spread_simulator import simulate_spread, simulate_antidote_spread
from experiments import compare_strategies


app = FastAPI(
    title="Spotted. API",
    description="Rumour Containment Simulator API evaluating strategic misinformation intervention on social networks.",
    version="0.1.0",
)

# Enable CORS for local Vite frontend development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """Return health status of the Spotted API service."""
    return HealthResponse(
        status="ok",
        app="Spotted.",
        version="0.1.0"
    )


@app.post("/api/network/generate", response_model=NetworkGenerateResponse, tags=["Network"])
def api_generate_network(req: NetworkGenerateRequest) -> NetworkGenerateResponse:
    """Generate a synthetic social network with realistic community structure."""
    try:
        graph, graph_dict = generate_network(num_users=req.num_users, seed=req.seed)
        
        # Pick the highest degree node or a central node as the suggested initial source
        degrees = dict(graph.degree())
        suggested_source = max(degrees.keys(), key=lambda k: degrees[k]) if degrees else 0

        return NetworkGenerateResponse(
            network=graph_dict,
            suggested_source=suggested_source,
            message=f"Generated connected social network with {graph.number_of_nodes()} nodes and {graph.number_of_edges()} edges."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate network: {str(e)}"
        )


@app.post("/api/simulation/run", response_model=SimulationRunResponse, tags=["Simulation"])
def api_run_simulation(req: SimulationRunRequest) -> SimulationRunResponse:
    """Simulate rumour propagation over discrete time steps on a provided network."""
    try:
        # Reconstruct NetworkX graph from request payload
        graph = dict_to_graph(nodes=req.nodes, edges=req.edges)
        
        if req.source not in graph:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Source node {req.source} does not exist in the provided network."
            )

        result = simulate_spread(
            graph=graph,
            source=req.source,
            probability=req.probability,
            interventions=req.interventions,
            budget=req.budget,
            intervention_details=req.intervention_details,
            antidote_sources=req.antidote_sources,
            antidote_probability=req.antidote_probability,
            seed=req.seed,
            max_steps=req.max_steps
        )
        return SimulationRunResponse(**result)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )


@app.post("/api/antidote/spread", response_model=AntidoteSpreadResponse, tags=["Antidote"])
def api_spread_antidote(req: AntidoteSpreadRequest) -> AntidoteSpreadResponse:
    """Probabilistically spread corrective Antidote information from a starting node."""
    try:
        graph = dict_to_graph(nodes=req.nodes, edges=req.edges)
        if req.antidote_source not in graph:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Antidote source node {req.antidote_source} does not exist in the provided network."
            )

        result = simulate_antidote_spread(
            graph=graph,
            source=req.antidote_source,
            probability=req.probability,
            existing_antidote_states=req.existing_antidote_states,
            seed=req.seed,
            max_steps=req.max_steps
        )
        return AntidoteSpreadResponse(**result)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Antidote propagation failed: {str(e)}"
        )


@app.post("/api/interventions/compare", response_model=InterventionCompareResponse, tags=["Experiments"])
def api_compare_interventions(req: InterventionCompareRequest) -> InterventionCompareResponse:
    """Benchmark and compare containment strategies across repeated simulation trials."""
    try:
        graph = dict_to_graph(nodes=req.nodes, edges=req.edges)

        if req.source not in graph:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Source node {req.source} does not exist in the provided network."
            )

        if req.budget >= graph.number_of_nodes():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Intervention budget ({req.budget}) must be less than total nodes ({graph.number_of_nodes()})."
            )

        comparison = compare_strategies(
            graph=graph,
            source=req.source,
            probability=req.probability,
            budget=req.budget,
            num_runs=req.num_runs,
            seed=req.seed
        )
        return InterventionCompareResponse(**comparison)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Strategy comparison failed: {str(e)}"
        )
