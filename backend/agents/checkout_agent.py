"""
Checkout Agent — handles OTP generation, verification, and order placement.
OTP is displayed on-screen for demo mode (no Twilio needed).
"""
import random
import time
import os
from datetime import datetime

# In-memory OTP store: phone → {otp, expires_at, attempts}
_otp_store: dict[str, dict] = {}

OTP_TTL_SECONDS = 300  # 5 minutes
MAX_ATTEMPTS = 3
OTP_PROVIDER = os.environ.get("OTP_PROVIDER", "mock")


def generate_otp(phone: str) -> dict:
    """
    Generate a 6-digit OTP for the given phone number.
    In demo mode, the OTP is returned directly (shown in UI).
    """
    # Clean up expired OTPs
    now = time.time()
    expired = [p for p, data in _otp_store.items() if data["expires_at"] < now]
    for p in expired:
        del _otp_store[p]

    # Generate OTP
    otp = str(random.randint(100000, 999999))

    _otp_store[phone] = {
        "otp": otp,
        "expires_at": now + OTP_TTL_SECONDS,
        "attempts": 0,
        "created_at": datetime.now().isoformat(),
    }

    result = {
        "success": True,
        "message": f"OTP sent to {phone[-4:].rjust(len(phone), '*')}",
        "expires_in": OTP_TTL_SECONDS,
        "demo_otp": otp,  # Only shown in demo/mock mode
    }

    if OTP_PROVIDER != "mock":
        result.pop("demo_otp", None)

    return result


def verify_otp(phone: str, otp: str) -> dict:
    """
    Verify the OTP for a phone number.
    Returns success/failure with appropriate error messages.
    """
    if phone not in _otp_store:
        return {"success": False, "error": "No OTP found for this number. Please request a new one."}

    data = _otp_store[phone]

    # Check expiry
    if time.time() > data["expires_at"]:
        del _otp_store[phone]
        return {"success": False, "error": "OTP has expired. Please request a new one."}

    # Check attempts
    data["attempts"] += 1
    if data["attempts"] > MAX_ATTEMPTS:
        del _otp_store[phone]
        return {"success": False, "error": "Too many attempts. Please request a new OTP."}

    # Verify
    if data["otp"] != otp.strip():
        remaining = MAX_ATTEMPTS - data["attempts"]
        return {
            "success": False,
            "error": f"Incorrect OTP. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
        }

    # Success — clean up
    del _otp_store[phone]
    return {"success": True, "message": "OTP verified successfully! ✅"}


def create_order(session_id: str, table_id: str, customer_name: str, cart_items: list[dict]) -> dict:
    """
    Create an order record (in-memory for demo).
    Returns order ID and estimated wait time.
    """
    import uuid

    order_id = f"ORD-{str(uuid.uuid4())[:8].upper()}"
    subtotal = sum(item["price"] * item["quantity"] for item in cart_items)
    tax = round(subtotal * 0.05, 2)  # 5% GST
    total = round(subtotal + tax, 2)

    # Estimate wait: 5 mins base + 3 mins per item
    estimated_wait = 5 + (len(cart_items) * 3)

    order = {
        "order_id": order_id,
        "session_id": session_id,
        "table_id": table_id,
        "customer_name": customer_name,
        "status": "confirmed",
        "items": cart_items,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "estimated_wait_minutes": min(estimated_wait, 30),
        "created_at": datetime.now().isoformat(),
        "status_timeline": [
            {"status": "confirmed", "time": datetime.now().isoformat(), "label": "Order Confirmed ✅"},
        ],
    }

    return order
