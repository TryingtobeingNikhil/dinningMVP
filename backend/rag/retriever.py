"""
RAG Retriever — cosine similarity search over pre-embedded menu items.
Filters by availability, allergens, and dietary preferences.
"""
import numpy as np
from rag.embedder import get_model, get_menu_embeddings, get_menu_items


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two normalized vectors."""
    return float(np.dot(a, b))


def search_menu(
    query: str,
    top_k: int = 10,
    exclude_ids: list[str] | None = None,
    exclude_allergens: list[str] | None = None,
    veg_only: bool = False,
    available_only: bool = True,
) -> list[dict]:
    """
    Semantic search over the menu using cosine similarity.
    Returns up to top_k relevant items with their similarity scores.
    """
    model = get_model()
    embeddings = get_menu_embeddings()
    menu_items = get_menu_items()

    if not embeddings:
        return []

    # Encode and normalize query
    query_vector = model.encode(query, normalize_embeddings=True)

    exclude_ids = exclude_ids or []
    exclude_allergens = [a.lower() for a in (exclude_allergens or [])]

    scored_items = []
    for item in menu_items:
        # Apply filters
        if item["id"] in exclude_ids:
            continue
        if available_only and not item["available"]:
            continue
        if veg_only and "veg" not in item["tags"] and "vegan" not in item["tags"]:
            continue
        if exclude_allergens:
            item_allergens = [a.lower() for a in item.get("allergens", [])]
            if any(a in item_allergens for a in exclude_allergens):
                continue

        # Cosine similarity score
        if item["id"] in embeddings:
            score = cosine_similarity(query_vector, embeddings[item["id"]])
            scored_items.append((score, item))

    # Sort by score descending
    scored_items.sort(key=lambda x: x[0], reverse=True)

    return [item for _, item in scored_items[:top_k]]


def get_popular_items(time_of_day: str = "dinner", top_k: int = 5) -> list[dict]:
    """Return top items by popular_score, optionally filtered by time context."""
    menu_items = get_menu_items()

    # Time-based category boosts
    time_boosts = {
        "breakfast": ["Beverages (Hot)", "Sides"],
        "lunch": ["Mains (Veg)", "Mains (Non-Veg)", "Breads & Rice"],
        "evening": ["Veg Starters", "Non-Veg Starters", "Beverages (Cold)"],
        "dinner": ["Mains (Veg)", "Mains (Non-Veg)", "Desserts"],
    }
    boosted_categories = time_boosts.get(time_of_day, [])

    scored = []
    for item in menu_items:
        if not item["available"]:
            continue
        score = item["popular_score"]
        if item["category"] in boosted_categories:
            score += 0.05  # Slight boost for time-appropriate categories
        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:top_k]]


def get_complementary_items(item_id: str) -> list[dict]:
    """Return items frequently ordered with the given item."""
    menu_items = get_menu_items()
    item_map = {item["id"]: item for item in menu_items}

    source = item_map.get(item_id)
    if not source:
        return []

    complementary_ids = source.get("complementary_items", [])
    return [item_map[cid] for cid in complementary_ids if cid in item_map and item_map[cid]["available"]]
