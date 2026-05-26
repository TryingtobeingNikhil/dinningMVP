"use client";
import { useEffect, useRef, useCallback } from "react";
import { useDiningStore } from "@/store/useStore";
import { createWebSocket } from "@/lib/api";

export function useWebSocket(tableId: string, userName: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const { addGroupUser, removeGroupUser, setGroupUsers, addToast, setCart, addMessage } = useDiningStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = createWebSocket(tableId, userName);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🔌 WebSocket connected for table", tableId);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWSEvent(msg);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket disconnected. Reconnecting in 3s...");
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.warn("WebSocket connection failed:", err);
    }
  }, [tableId, userName]);

  function handleWSEvent(msg: { event: string; data: Record<string, unknown> }) {
    switch (msg.event) {
      case "session:user_joined": {
        const name = msg.data.display_name as string;
        const users = msg.data.active_users as string[];
        if (users) setGroupUsers(users);
        if (name && name !== userName) {
          addToast(`${name} joined the table! 👋`, "info");
          addMessage({
            id: Math.random().toString(36),
            role: "assistant",
            content: `Hey! **${name}** just joined the table. ${users?.length > 1 ? `${users.length} people ordering together!` : ""} 🎉`,
            timestamp: new Date(),
          });
        }
        break;
      }

      case "session:user_left": {
        const name = msg.data.display_name as string;
        if (name && name !== userName) {
          removeGroupUser(name);
          addToast(`${name} left the table`, "info");
        }
        break;
      }

      case "cart:item_added": {
        const addedBy = msg.data.added_by as string;
        const itemName = msg.data.name as string;
        if (addedBy && addedBy !== userName) {
          addToast(`${addedBy} added ${itemName} 🛒`, "info");
        }
        break;
      }

      case "cart:item_removed": {
        break;
      }

      case "order:placed": {
        const orderId = msg.data.order_id as string;
        const customerName = msg.data.customer_name as string;
        addToast(`🎉 Order ${orderId} placed by ${customerName}!`, "success");
        break;
      }
    }
  }

  useEffect(() => {
    if (tableId && userName) connect();
    return () => {
      wsRef.current?.close();
    };
  }, [tableId, userName, connect]);

  const send = useCallback((event: string, data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data, table_id: tableId }));
    }
  }, [tableId]);

  return { send };
}
