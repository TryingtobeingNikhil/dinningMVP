"""
Recommendation Agent — core menu intelligence.
Performs RAG (cosine search) then sends top results to Groq LLM.
Returns structured suggestions with item IDs the frontend can act on.
Matches the exact output format specified in the assignment.
"""
import json
import os
from datetime import datetime
from groq import Groq
from rag.retriever import search_menu, get_popular_items

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
RESTAURANT_NAME = os.environ.get("RESTAURANT_NAME", "Spice Garden")


def get_time_of_day() -> str:
    hour = datetime.now().hour
    if 7 <= hour < 12:
        return "breakfast"
    elif 12 <= hour < 16:
        return "lunch"
    elif 16 <= hour < 20:
        return "evening"
    else:
        return "dinner"


def build_system_prompt(time_of_day: str, preferences: dict, cart_summary: str) -> str:
    """Build the recommendation agent system prompt — matches assignment spec exactly."""
    pref_lines = []
    if preferences.get("spicy") is True:
        pref_lines.append("User likes spicy food")
    if preferences.get("veg") is True:
        pref_lines.append("User prefers vegetarian")
    if preferences.get("veg") is False:
        pref_lines.append("User is fine with non-veg")
    if preferences.get("light") is True:
        pref_lines.append("User wants light/low-calorie options")
    if preferences.get("allergens_to_avoid"):
        pref_lines.append(f"AVOID allergens: {', '.join(preferences['allergens_to_avoid'])}")

    pref_str = "\n".join(pref_lines) if pref_lines else "No specific preferences set"

    return f"""You are Zara, a witty and knowledgeable dining assistant at {RESTAURANT_NAME}.
Your job is to suggest menu items based on the user's preferences.

Current context:
- Time of day: {time_of_day}
- User preferences: {pref_str}
- Current cart: {cart_summary}

Rules:
- Suggest AT MOST 3 items
- Each suggestion must include: itemId, name, price, one-line reason
- Never suggest items already in the cart
- Never mention items not in the provided menu list
- Respond in the same language/mix the user used (support Hinglish)
- Be warm and brief; max 2 sentences before the item list
- Be Zara — warm, slightly witty, never robotic

Output format (strict JSON):
{{"message": "...", "suggestions": [{{"itemId": "...", "name": "...", "price": 0, "reason": "...", "image_url": "..."}}]}}"""


async def get_recommendations(
    query: str,
    preferences: dict,
    cart_items: list[dict],
    language: str = "en",
    use_popular: bool = False,
) -> dict:
    """
    Recommendation Agent main flow:
    1. RAG search → top 10 semantically relevant items
    2. Inject into Groq prompt
    3. Return structured suggestions
    """
    time_of_day = get_time_of_day()

    # Get cart item IDs to exclude
    cart_ids = [item["item_id"] for item in cart_items]
    cart_summary = (
        ", ".join([f"{item['name']} x{item['quantity']}" for item in cart_items])
        if cart_items
        else "Cart is empty"
    )

    # Step 1: RAG search
    if use_popular:
        menu_results = get_popular_items(time_of_day, top_k=10)
        # Filter out items already in cart
        menu_results = [m for m in menu_results if m["id"] not in cart_ids]
    else:
        menu_results = search_menu(
            query=query,
            top_k=10,
            exclude_ids=cart_ids,
            exclude_allergens=preferences.get("allergens_to_avoid", []),
            veg_only=preferences.get("veg") is True,
        )

    if not menu_results:
        return {
            "message": "Hmm, I couldn't find anything matching that! Try something else? 🤔",
            "suggestions": [],
        }

    # Step 2: Build prompt with top-10 RAG results
    menu_context = json.dumps(
        [
            {
                "itemId": item["id"],
                "name": item["name"],
                "price": item["price"],
                "description": item["description"],
                "tags": item["tags"],
                "image_url": item["image_url"],
                "calories": item.get("calories"),
            }
            for item in menu_results
        ],
        indent=2,
    )

    system_prompt = build_system_prompt(time_of_day, preferences, cart_summary)

    # Step 3: Call Groq LLM
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"Available menu items (semantic matches):\n{menu_context}\n\nUser says: {query}",
            },
        ],
        temperature=0.7,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    try:
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception:
        return {
            "message": "Let me find something perfect for you!",
            "suggestions": [
                {
                    "itemId": item["id"],
                    "name": item["name"],
                    "price": item["price"],
                    "reason": item["description"][:60],
                    "image_url": item["image_url"],
                }
                for item in menu_results[:3]
            ],
        }
