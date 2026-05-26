"""
Upsell Agent — monitors cart composition and triggers contextual suggestions.
Fires at specific trigger points defined in the assignment spec.
Uses Groq to generate warm, non-pushy upsell copy.
"""
import json
import os
from groq import Groq
from rag.retriever import get_complementary_items, get_popular_items
from datetime import datetime

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

UPSELL_SYSTEM_PROMPT = """You are Zara, a friendly dining assistant. Generate a warm, brief upsell suggestion.
Be helpful, not pushy. Max 2 sentences. Sound natural, like a friend recommending something.
Return JSON: {"message": "...", "item_id": "...", "item_name": "..."}"""


def detect_upsell_trigger(cart_items: list[dict]) -> str | None:
    """
    Check which upsell trigger applies to the current cart.
    Returns trigger type or None if no trigger applies.
    """
    if not cart_items:
        return None

    cart_total = sum(item["price"] * item["quantity"] for item in cart_items)
    cart_tags_all = []
    has_beverage = False
    has_mains = False
    has_veg_only = True
    has_dessert = False

    for item in cart_items:
        # We'd check item categories/tags here
        name_lower = item["name"].lower()
        if any(bev in name_lower for bev in ["lassi", "chai", "coffee", "soda", "juice"]):
            has_beverage = True
        if any(m in name_lower for m in ["butter chicken", "dal", "palak", "biryani", "curry", "paneer butter"]):
            has_mains = True
        if any(nv in name_lower for nv in ["chicken", "fish", "prawn", "mutton"]):
            has_veg_only = False
        if any(d in name_lower for d in ["gulab", "kulfi", "halwa", "kheer"]):
            has_dessert = True

    # Trigger: Cart has mains but no beverage
    if has_mains and not has_beverage:
        return "no_beverage"

    # Trigger: Cart total approaches ₹500
    if 350 <= cart_total < 500:
        return "near_combo_threshold"

    # Trigger: Cart has veg items only
    if has_veg_only and cart_total > 200:
        return "all_veg"

    # Trigger: Evening dessert
    hour = datetime.now().hour
    if 16 <= hour < 20 and not has_dessert and cart_total > 200:
        return "evening_dessert"

    return None


async def get_upsell_suggestion(
    trigger_item_id: str | None,
    cart_items: list[dict],
    trigger_type: str = "after_add",
) -> dict | None:
    """
    Generate upsell suggestion based on trigger type.
    Returns None if no upsell should be shown.
    """
    cart_total = sum(item["price"] * item["quantity"] for item in cart_items)

    # After add-to-cart: suggest complementary items
    if trigger_type == "after_add" and trigger_item_id:
        complementary = get_complementary_items(trigger_item_id)
        if not complementary:
            return None

        target = complementary[0]
        last_item = next((i for i in cart_items if i["item_id"] == trigger_item_id), None)
        last_name = last_item["name"] if last_item else "that"

        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": UPSELL_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Customer just added '{last_name}'. Suggest '{target['name']}' (₹{target['price']}) as a companion. Be warm and brief.",
                    },
                ],
                temperature=0.7,
                max_tokens=120,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return {
                "message": result.get("message", f"Great choice! Most people pair {last_name} with {target['name']} — it's only ₹{target['price']} and totally worth it."),
                "suggestion_item": target,
                "trigger": "after_add",
            }
        except Exception:
            return {
                "message": f"Great pick! Most people grab {target['name']} with this — it's only ₹{target['price']} and totally worth it. 😋",
                "suggestion_item": target,
                "trigger": "after_add",
            }

    # No beverage trigger
    if trigger_type == "no_beverage":
        popular = get_popular_items("evening", top_k=5)
        beverages = [i for i in popular if "beverage" in i.get("category", "").lower() or "Beverage" in i.get("category", "")]
        if not beverages:
            return None
        bev = beverages[0]
        return {
            "message": f"Looks like you're missing drinks! How about a {bev['name']} for ₹{bev['price']}? 🥤",
            "suggestion_item": bev,
            "trigger": "no_beverage",
        }

    # Near combo threshold
    if trigger_type == "near_combo_threshold":
        gap = 500 - cart_total
        popular = get_popular_items(top_k=5)
        affordable = [i for i in popular if i["price"] >= gap - 20 and i["price"] <= gap + 100]
        if not affordable:
            return None
        item = affordable[0]
        return {
            "message": f"You're ₹{int(gap)} away from our ₹500 Meal Deal! Add {item['name']} to unlock it 🎉",
            "suggestion_item": item,
            "trigger": "near_combo_threshold",
        }

    return None
