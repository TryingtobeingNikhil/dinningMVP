"""
Intent Router — classifies user message into a structured intent.
Uses Groq (free) with LLaMA 3.1-8b-instant for ultra-fast classification.
Returns structured JSON: {intent, preferences, language_detected, raw_text}
"""
import json
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

INTENT_SYSTEM_PROMPT = """You are the Intent Router for a smart restaurant AI. 
Classify the user's message and extract structured preferences.

Return ONLY valid JSON matching this exact schema:
{
  "intent": "GREET|RECOMMEND|ADD_ITEM|REMOVE_ITEM|CHECKOUT|POPULAR|GROUP_INFO|FALLBACK",
  "item_name": "extracted item name if ADD_ITEM or REMOVE_ITEM, else null",
  "preferences": {
    "spicy": true/false/null,
    "veg": true/false/null,
    "light": true/false/null,
    "sweet": true/false/null,
    "allergens_to_avoid": []
  },
  "language_detected": "en|hinglish|telugu_english",
  "normalised_query": "English version of the user's request for RAG search"
}

Intent definitions:
- GREET: hello, hi, first message, mood setting
- RECOMMEND: asking for suggestions, "what should I order", "something spicy"
- ADD_ITEM: explicitly wants to add a specific item to cart
- REMOVE_ITEM: wants to remove an item
- CHECKOUT: ready to pay, place order, done ordering
- POPULAR: asking what's popular, bestseller, chef special
- GROUP_INFO: asking about the table, other users
- FALLBACK: anything else (questions about restaurant, hours, etc.)

Hinglish examples: "kuch spicy chahiye" → RECOMMEND, spicy=true
Telugu-English: "konchem spicy ga undali" → RECOMMEND, spicy=true"""


async def classify_intent(message: str, conversation_history: list[dict] | None = None) -> dict:
    """
    Classify user intent using Groq LLaMA.
    Returns structured dict with intent, preferences, and language detection.
    """
    messages = [{"role": "system", "content": INTENT_SYSTEM_PROMPT}]

    # Add recent conversation context (last 3 exchanges)
    if conversation_history:
        for h in conversation_history[-6:]:
            messages.append(h)

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.1,  # Very low — we want consistent classification
        max_tokens=300,
        response_format={"type": "json_object"},
    )

    try:
        result = json.loads(response.choices[0].message.content)
        return result
    except (json.JSONDecodeError, KeyError):
        # Fallback intent
        return {
            "intent": "FALLBACK",
            "item_name": None,
            "preferences": {},
            "language_detected": "en",
            "normalised_query": message,
        }
