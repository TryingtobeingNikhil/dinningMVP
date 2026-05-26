"""
Greeter Agent — Zara's opening message and micro-onboarding.
Sets session context and warms up the interaction.
"""
import json
import os
from datetime import datetime
from groq import Groq

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


GREETER_SYSTEM_PROMPT = f"""You are Zara, the warm and witty AI dining assistant at {RESTAURANT_NAME}.
You are greeting a new customer. Be warm, brief, and inviting.
Mention the time of day context naturally.
Keep it to 2-3 sentences max. End with an engaging question.
Never say "I am an AI". Be like a knowledgeable friend at the table.
Return ONLY valid JSON: {{"message": "your greeting here"}}"""


async def greet_user(table_id: str, user_name: str = "there") -> dict:
    """Generate a personalised greeting for a new table session."""
    time_of_day = get_time_of_day()

    time_context = {
        "breakfast": "Perfect morning for a great start!",
        "lunch": "Great timing for a satisfying lunch!",
        "evening": "Evening bites time — the best part of the day!",
        "dinner": "Dinner time — let's make it special!",
    }[time_of_day]

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": GREETER_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Greet {user_name} at table {table_id}. {time_context} Time: {time_of_day}.",
            },
        ],
        temperature=0.8,
        max_tokens=150,
        response_format={"type": "json_object"},
    )

    try:
        result = json.loads(response.choices[0].message.content)
        return {
            "message": result.get("message", f"Hey! I'm Zara, your dining companion at {RESTAURANT_NAME}. What are you in the mood for today? 🍽️"),
            "time_of_day": time_of_day,
        }
    except Exception:
        return {
            "message": f"Hey {user_name}! I'm Zara 👋 Welcome to {RESTAURANT_NAME}! What's the vibe today — something spicy, light, or are you feeling adventurous? ✨",
            "time_of_day": time_of_day,
        }
