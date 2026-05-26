// API client — all calls to the FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getMenu() {
  const res = await fetch(`${API_BASE}/api/menu`, { cache: "no-store" });
  return res.json();
}

export async function getTableSession(tableId: string, userName: string) {
  const res = await fetch(
    `${API_BASE}/api/table/${tableId}/session?user_name=${encodeURIComponent(userName)}`
  );
  return res.json();
}

export async function sendChatMessage(
  sessionId: string,
  payload: {
    message: string;
    table_id: string;
    user_name?: string;
    cart?: unknown[];
    preferences?: Record<string, unknown>;
  }
) {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function addToCart(
  sessionId: string,
  payload: {
    item_id: string;
    quantity: number;
    added_by: string;
    table_id: string;
    special_instructions?: string;
  }
) {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function removeFromCart(sessionId: string, itemId: string) {
  const res = await fetch(
    `${API_BASE}/api/session/${sessionId}/cart/${itemId}`,
    { method: "DELETE" }
  );
  return res.json();
}

export async function sendOTP(phone: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/api/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, session_id: sessionId }),
  });
  return res.json();
}

export async function verifyOTP(
  phone: string,
  otp: string,
  sessionId: string,
  customerName: string
) {
  const res = await fetch(`${API_BASE}/api/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      otp,
      session_id: sessionId,
      customer_name: customerName,
    }),
  });
  return res.json();
}

export async function placeOrder(
  sessionId: string,
  payload: {
    table_id: string;
    customer_name: string;
    customer_phone: string;
    cart: unknown[];
  }
) {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, ...payload }),
  });
  return res.json();
}

export async function getPopularItems(time?: string) {
  const res = await fetch(`${API_BASE}/api/popular?time=${time || "dinner"}`);
  return res.json();
}

export function createWebSocket(tableId: string, userName: string): WebSocket {
  const wsBase = API_BASE.replace("http://", "ws://").replace(
    "https://",
    "wss://"
  );
  return new WebSocket(
    `${wsBase}/ws/${tableId}?user_name=${encodeURIComponent(userName)}`
  );
}
