"""
RAG Embedder — embeds menu items at startup using sentence-transformers.
100% free, runs locally, no API key required.
Model: all-MiniLM-L6-v2 (80MB, downloads once, very fast on CPU)
"""
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Singleton model — loaded once at startup
_model: SentenceTransformer | None = None
_menu_embeddings: dict[str, np.ndarray] = {}
_menu_items: list[dict] = []


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print("🔄 Loading sentence-transformers model (first run only)...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Model loaded!")
    return _model


def load_and_embed_menu() -> None:
    """Load menu.json and pre-compute embeddings for all items."""
    global _menu_embeddings, _menu_items

    menu_path = Path(__file__).parent.parent / "data" / "menu.json"
    with open(menu_path) as f:
        _menu_items = json.load(f)

    model = get_model()
    print(f"🍽️  Embedding {len(_menu_items)} menu items...")

    for item in _menu_items:
        # Rich text for better semantic matching
        text = (
            f"{item['name']}. {item['description']} "
            f"Category: {item['category']}. "
            f"Tags: {', '.join(item['tags'])}. "
            f"Allergens: {', '.join(item['allergens']) if item['allergens'] else 'none'}. "
            f"Price: ₹{item['price']}."
        )
        _menu_embeddings[item["id"]] = model.encode(text, normalize_embeddings=True)

    print(f"✅ Menu embedded! {len(_menu_embeddings)} items ready.")


def get_menu_items() -> list[dict]:
    return _menu_items


def get_menu_embeddings() -> dict[str, np.ndarray]:
    return _menu_embeddings
