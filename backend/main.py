"""
Smart Dining Assistant — FastAPI Backend
Orchestrates all agents: Greeter, Intent Router, Recommendation, Upsell, Checkout
Real-time group ordering via WebSockets
"""
import json
import os
import time
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models.schemas import ChatMessage, OTPRequest, OTPVerify, OrderRequest
from agents.intent_router import classify_intent
from agents.greeter_agent import greet_user
from agents.recommend_agent import get_recommendations
from agents.upsell_agent import get_upsell_suggestion, detect_upsell_trigger
from agents.checkout_agent import generate_otp, verify_otp, create_order
from rag.embedder import load_and_embed_menu, get_menu_items
from rag.retriever import get_popular_items, search_menu
from realtime.ws_manager import manager


# ─── Startup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load menu embeddings on startup."""
    print("🚀 Starting Smart Dining Assistant backend...")
    load_and_embed_menu()
    print("✅ Backend ready!")
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title="Smart Dining Assistant API",
    description="AI-powered dining assistant with multi-agent orchestration",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to FRONTEND_URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory session store ─────────────────────────────────────────────────
# session_id → {cart, preferences, conversation_history, user_name}
sessions: dict[str, dict] = {}


def get_or_create_session(session_id: str, table_id: str, user_name: str = "Guest") -> dict:
    if session_id not in sessions:
        sessions[session_id] = {
            "session_id": session_id,
            "table_id": table_id,
            "cart": [],
            "preferences": {},
            "conversation_history": [],
            "user_name": user_name,
            "created_at": time.time(),
        }
    return sessions[session_id]


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "menu_items": len(get_menu_items())}


# ─── Menu Routes ─────────────────────────────────────────────────────────────

@app.get("/api/menu")
async def get_menu():
    """Return full menu."""
    return {"items": get_menu_items()}


@app.get("/api/menu/search")
async def search_menu_endpoint(q: str, veg: bool = False):
    """Semantic menu search."""
    results = search_menu(query=q, top_k=10, veg_only=veg)
    return {"items": results, "query": q}


@app.get("/api/popular")
async def popular_items(time: str = "dinner"):
    """Get popular items by time of day."""
    items = get_popular_items(time_of_day=time, top_k=5)
    return {"items": items}


# ─── Session Routes ───────────────────────────────────────────────────────────

@app.get("/api/table/{table_id}/session")
async def get_table_session(table_id: str, user_name: str = "Guest"):
    """Get or create a session for a table."""
    import uuid
    session_id = f"{table_id}-{str(uuid.uuid4())[:8]}"
    session = get_or_create_session(session_id, table_id, user_name)
    return {"session_id": session_id, "table_id": table_id, "user_name": user_name}


@app.get("/api/session/{session_id}/cart")
async def get_cart(session_id: str):
    session = sessions.get(session_id, {})
    return {"cart": session.get("cart", []), "session_id": session_id}


@app.post("/api/session/{session_id}/cart")
async def add_to_cart(session_id: str, payload: dict):
    """Add item to cart and broadcast to group."""
    item_id = payload.get("item_id")
    quantity = payload.get("quantity", 1)
    added_by = payload.get("added_by", "Guest")
    special_instructions = payload.get("special_instructions", "")
    table_id = payload.get("table_id", "T1")

    # Find menu item
    menu_items = get_menu_items()
    item = next((m for m in menu_items if m["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    session = get_or_create_session(session_id, table_id, added_by)

    # Check if item already in cart → increment quantity
    existing = next((ci for ci in session["cart"] if ci["item_id"] == item_id), None)
    if existing:
        existing["quantity"] += quantity
    else:
        session["cart"].append({
            "item_id": item_id,
            "name": item["name"],
            "price": item["price"],
            "quantity": quantity,
            "special_instructions": special_instructions,
            "added_by": added_by,
            "image_url": item["image_url"],
        })

    cart_total = sum(ci["price"] * ci["quantity"] for ci in session["cart"])

    # Broadcast to group
    await manager.broadcast(table_id, {
        "event": "cart:item_added",
        "data": {
            "item_id": item_id,
            "name": item["name"],
            "qty": quantity,
            "added_by": added_by,
            "cart_total": cart_total,
        },
    })

    # Check upsell trigger
    trigger_type = detect_upsell_trigger(session["cart"])
    upsell = None
    if trigger_type:
        upsell = await get_upsell_suggestion(item_id, session["cart"], trigger_type)
    elif len(session["cart"]) <= 3:  # After-add upsell for first few items
        upsell = await get_upsell_suggestion(item_id, session["cart"], "after_add")

    return {
        "success": True,
        "cart": session["cart"],
        "cart_total": cart_total,
        "upsell": upsell,
    }


@app.delete("/api/session/{session_id}/cart/{item_id}")
async def remove_from_cart(session_id: str, item_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["cart"] = [ci for ci in session["cart"] if ci["item_id"] != item_id]

    await manager.broadcast(session["table_id"], {
        "event": "cart:item_removed",
        "data": {"item_id": item_id},
    })

    return {"success": True, "cart": session["cart"]}


# ─── AI Chat Route ────────────────────────────────────────────────────────────

@app.post("/api/session/{session_id}/ai/chat")
async def ai_chat(session_id: str, body: ChatMessage):
    """
    Main orchestration endpoint.
    Runs: Multilingual NLU → Intent Router → Specialist Agent → Response
    Returns agent_events for the frontend animation panel.
    """
    session = get_or_create_session(session_id, body.table_id, body.user_name or "Guest")

    # Update session state from request
    if body.cart:
        session["cart"] = [c.model_dump() for c in body.cart]
    if body.preferences:
        session["preferences"].update(body.preferences)

    agent_events = []
    start_time = time.time()

    # ── Agent 1: Multilingual NLU (Intent Router) ──────────────────────────
    agent_events.append({"agent": "Multilingual NLU", "status": "thinking"})
    intent_result = await classify_intent(
        body.message,
        conversation_history=session["conversation_history"][-6:],
    )
    nlu_ms = int((time.time() - start_time) * 1000)
    agent_events[-1] = {"agent": "Multilingual NLU", "status": "done", "ms": nlu_ms,
                        "result": f"Intent: {intent_result.get('intent')} | Lang: {intent_result.get('language_detected')}"}

    intent = intent_result.get("intent", "FALLBACK")
    preferences = intent_result.get("preferences", {})
    language = intent_result.get("language_detected", "en")
    normalised_query = intent_result.get("normalised_query", body.message)

    # Merge preferences into session
    for k, v in preferences.items():
        if v is not None:
            session["preferences"][k] = v

    # ── Route to specialist agents ─────────────────────────────────────────
    response_data = {}

    if intent == "GREET":
        agent_events.append({"agent": "Greeter Agent", "status": "thinking"})
        t = time.time()
        result = await greet_user(body.table_id, body.user_name or "there")
        agent_events[-1] = {"agent": "Greeter Agent", "status": "done",
                            "ms": int((time.time() - t) * 1000), "result": "Greeting prepared"}
        response_data = {"message": result["message"], "suggestions": []}

    elif intent in ("RECOMMEND", "POPULAR"):
        agent_events.append({"agent": "Context Memory", "status": "thinking"})
        time.sleep(0.05)  # Simulate memory lookup
        agent_events[-1] = {"agent": "Context Memory", "status": "done", "ms": 50,
                            "result": f"Preferences loaded: {json.dumps(session['preferences'])[:60]}"}

        agent_events.append({"agent": "Recommendation Agent", "status": "thinking"})
        t = time.time()
        result = await get_recommendations(
            query=normalised_query,
            preferences=session["preferences"],
            cart_items=session["cart"],
            language=language,
            use_popular=(intent == "POPULAR"),
        )
        agent_events[-1] = {"agent": "Recommendation Agent", "status": "done",
                            "ms": int((time.time() - t) * 1000),
                            "result": f"{len(result.get('suggestions', []))} items found via RAG"}
        response_data = result

    elif intent == "ADD_ITEM":
        item_name = intent_result.get("item_name", "")
        agent_events.append({"agent": "Order Agent", "status": "thinking"})
        t = time.time()

        # Find item by name similarity
        menu_items = get_menu_items()
        matched = next(
            (m for m in menu_items if item_name.lower() in m["name"].lower() or m["name"].lower() in item_name.lower()),
            None,
        )

        if matched:
            agent_events[-1] = {"agent": "Order Agent", "status": "done",
                                "ms": int((time.time() - t) * 1000), "result": f"Adding {matched['name']} to cart"}
            response_data = {
                "message": f"Adding {matched['name']} to your cart! 🛒",
                "suggestions": [],
                "action": "add_to_cart",
                "action_data": {"item_id": matched["id"], "item": matched},
            }
        else:
            # Fall back to recommendation
            result = await get_recommendations(query=item_name, preferences=session["preferences"],
                                               cart_items=session["cart"], language=language)
            agent_events[-1] = {"agent": "Order Agent", "status": "done",
                                "ms": int((time.time() - t) * 1000), "result": "Item not found, showing alternatives"}
            response_data = {
                "message": f"I couldn't find '{item_name}' exactly, but here are some great alternatives!",
                "suggestions": result.get("suggestions", []),
            }

    elif intent == "CHECKOUT":
        agent_events.append({"agent": "Checkout Agent", "status": "thinking"})
        time.sleep(0.1)
        agent_events[-1] = {"agent": "Checkout Agent", "status": "done", "ms": 100, "result": "Ready for checkout"}
        response_data = {
            "message": "Ready to place your order? 🎉 I'll need your name and phone number to send you an OTP. Click 'Place Order' in your cart!",
            "suggestions": [],
            "action": "open_checkout",
        }

    else:  # FALLBACK
        agent_events.append({"agent": "General Agent", "status": "thinking"})
        t = time.time()

        from groq import Groq
        groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        fb_response = groq_client.chat.completions.create(
            model=os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[
                {"role": "system", "content": f"You are Zara, a warm dining assistant at {os.environ.get('RESTAURANT_NAME', 'Spice Garden')}. Answer helpfully and briefly (2-3 sentences max). Don't recommend items not in context."},
                {"role": "user", "content": body.message},
            ],
            temperature=0.7,
            max_tokens=200,
        )
        agent_events[-1] = {"agent": "General Agent", "status": "done", "ms": int((time.time() - t) * 1000), "result": "Response generated"}
        response_data = {"message": fb_response.choices[0].message.content, "suggestions": []}

    # ── Store conversation turn ─────────────────────────────────────────────
    session["conversation_history"].append({"role": "user", "content": body.message})
    session["conversation_history"].append({"role": "assistant", "content": response_data.get("message", "")})

    # Keep last 20 messages
    if len(session["conversation_history"]) > 20:
        session["conversation_history"] = session["conversation_history"][-20:]

    total_ms = int((time.time() - start_time) * 1000)

    return {
        **response_data,
        "agent_events": agent_events,
        "total_ms": total_ms,
        "language_detected": language,
        "intent": intent,
    }


# ─── OTP / Checkout Routes ────────────────────────────────────────────────────

@app.post("/api/otp/send")
async def send_otp(body: OTPRequest):
    result = generate_otp(body.phone)
    return result


@app.post("/api/otp/verify")
async def verify_otp_endpoint(body: OTPVerify):
    result = verify_otp(body.phone, body.otp)
    return result


@app.post("/api/session/{session_id}/order")
async def place_order(session_id: str, body: OrderRequest):
    """Place final order after OTP verification."""
    session = sessions.get(session_id, {})
    cart = session.get("cart", body.cart)

    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order = create_order(session_id, body.table_id, body.customer_name, cart)

    # Broadcast order confirmation to group
    await manager.broadcast(body.table_id, {
        "event": "order:placed",
        "data": {
            "order_id": order["order_id"],
            "status": order["status"],
            "estimated_wait": order["estimated_wait_minutes"],
            "customer_name": body.customer_name,
        },
    })

    # Clear session cart
    if session_id in sessions:
        sessions[session_id]["cart"] = []

    return order


# ─── WebSocket Route ─────────────────────────────────────────────────────────

@app.websocket("/ws/{table_id}")
async def websocket_endpoint(websocket: WebSocket, table_id: str, user_name: str = "Guest"):
    """WebSocket endpoint for real-time group ordering sync."""
    await manager.connect(websocket, table_id, user_name)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            # Broadcast any client-sent event to the table group
            await manager.broadcast(table_id, {**msg, "table_id": table_id})
    except WebSocketDisconnect:
        manager.disconnect(websocket, table_id, user_name)
        await manager.broadcast(table_id, {
            "event": "session:user_left",
            "data": {"display_name": user_name, "active_users": manager.get_users(table_id)},
        })
