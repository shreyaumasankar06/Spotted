"""Network Generator Module for Spotted. (Person 1)

Generates synthetic social networks exhibiting real-world topological features:
clustered communities, hubs, and inter-community bridge edges.
Provides serialization and deserialization utilities for NetworkX graphs.
"""

from typing import Optional, Tuple, Dict, Any, List
import random
import networkx as nx


def generate_network(
    num_users: int = 50,
    seed: Optional[int] = None
) -> Tuple[nx.Graph, Dict[str, Any]]:
    """Generate a synthetic social network with realistic community structure and bridges.
    
    Args:
        num_users: Number of user nodes (between 5 and 1000).
        seed: Optional random seed for reproducible network generation.
        
    Returns:
        Tuple[nx.Graph, Dict[str, Any]]: 
            - NetworkX undirected Graph instance
            - GraphData dictionary matching Pydantic GraphData schema
            
    Raises:
        ValueError: If num_users is less than 5 or greater than 1000.
    """
    if num_users < 5 or num_users > 1000:
        raise ValueError(f"num_users must be between 5 and 1000, got {num_users}")

    rng = random.Random(seed)

    # Determine number of communities (2 to 6 based on size)
    num_communities = max(2, min(6, num_users // 8))
    
    # Partition nodes among communities
    base_size = num_users // num_communities
    remainder = num_users % num_communities
    community_sizes = [base_size + (1 if i < remainder else 0) for i in range(num_communities)]

    G = nx.Graph()

    current_id = 0
    community_nodes: List[List[int]] = []

    for comm_idx, size in enumerate(community_sizes):
        nodes_in_comm = list(range(current_id, current_id + size))
        community_nodes.append(nodes_in_comm)
        
        # Add nodes with community attribute
        for node in nodes_in_comm:
            G.add_node(node, community=comm_idx, label=f"User {node}")
        
        # Intra-community connectivity: small-world ring + shortcuts
        if size > 1:
            # Create a cycle or path to ensure intra-community connectivity
            for j in range(size):
                u = nodes_in_comm[j]
                v = nodes_in_comm[(j + 1) % size]
                G.add_edge(u, v)

            # Add random intra-community shortcuts (density ~ 0.2)
            for i in range(size):
                for j in range(i + 2, size):
                    if (i == 0 and j == size - 1):
                        continue
                    if rng.random() < 0.25:
                        G.add_edge(nodes_in_comm[i], nodes_in_comm[j])

        current_id += size

    # Add inter-community bridge edges to connect communities
    for i in range(num_communities):
        next_comm = (i + 1) % num_communities
        # Guarantee at least 1 bridge between adjacent communities
        u = rng.choice(community_nodes[i])
        v = rng.choice(community_nodes[next_comm])
        G.add_edge(u, v)
        
        # Additional random bridge edges across random community pairs
        for other_comm in range(i + 1, num_communities):
            if other_comm != next_comm and rng.random() < 0.35:
                bridge_u = rng.choice(community_nodes[i])
                bridge_v = rng.choice(community_nodes[other_comm])
                G.add_edge(bridge_u, bridge_v)

    # Ensure full network connectivity by linking any disconnected components
    if not nx.is_connected(G):
        components = list(nx.connected_components(G))
        for k in range(len(components) - 1):
            c1_node = rng.choice(list(components[k]))
            c2_node = rng.choice(list(components[k + 1]))
            G.add_edge(c1_node, c2_node)

    # Compute degrees for each node
    for node in G.nodes():
        G.nodes[node]["degree"] = G.degree(node)

    serialized_data = graph_to_dict(G)
    return G, serialized_data


def graph_to_dict(graph: nx.Graph) -> Dict[str, Any]:
    """Serialize a NetworkX graph into a dictionary compatible with the GraphData schema.
    
    Args:
        graph: NetworkX Graph instance
        
    Returns:
        Dict[str, Any]: Dictionary containing 'nodes', 'edges', 'num_nodes', 'num_edges'
    """
    nodes = []
    for node_id, data in sorted(graph.nodes(data=True)):
        nodes.append({
            "id": int(node_id),
            "label": data.get("label", f"User {node_id}"),
            "state": data.get("state", "unaware"),
            "community": data.get("community", 0),
            "degree": graph.degree(node_id)
        })

    edges = []
    for u, v in sorted(graph.edges()):
        edges.append({
            "source": int(u),
            "target": int(v)
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "num_nodes": len(nodes),
        "num_edges": len(edges)
    }


def dict_to_graph(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> nx.Graph:
    """Deserialize nodes and edges list into a NetworkX Graph instance.
    
    Args:
        nodes: List of node dictionaries containing at least 'id'
        edges: List of edge dictionaries containing 'source' and 'target'
        
    Returns:
        nx.Graph: Reconstructed NetworkX undirected graph
    """
    G = nx.Graph()
    for n in nodes:
        node_id = int(n["id"] if isinstance(n, dict) else n.id)
        comm = n.get("community") if isinstance(n, dict) else getattr(n, "community", None)
        lbl = n.get("label") if isinstance(n, dict) else getattr(n, "label", None)
        G.add_node(node_id, community=comm, label=lbl or f"User {node_id}")

    for e in edges:
        src = int(e["source"] if isinstance(e, dict) else e.source)
        tgt = int(e["target"] if isinstance(e, dict) else e.target)
        G.add_edge(src, tgt)

    for node in G.nodes():
        G.nodes[node]["degree"] = G.degree(node)

    return G
