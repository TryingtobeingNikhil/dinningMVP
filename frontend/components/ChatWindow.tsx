"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDiningStore } from "@/store/useStore";
import { AgentPanel } from "./AgentPanel";
import { sendChatMessage, addToCart as apiAddToCart } from "@/lib/api";
import type { ChatMessage, Suggestion, MenuItem } from "@/types";

const QUICK_SUGGESTIONS = [
  { label: "🌶️ Spicy", message: "I want something really spicy" },
  { label: "🥗 Light", message: "Show me light options, low calorie" },
  { label: "🍽️ Filling", message: "I'm very hungry, something filling" },
  { label: "🍰 Dessert", message: "What desserts do you have?" },
  { label: "🍹 Drinks", message: "Recommend drinks to pair with my order" },
  { label: "⭐ Best Sellers", message: "What's most popular here?" },
  { label: "🤝 For Groups", message: "We are 4 people, mix veg and non-veg" },
  { label: "👨‍🍳 Chef Special", message: "What's the chef's special today?" },
];

function SuggestionCard({
  suggestion,
  onAdd,
}: {
  suggestion: Suggestion;
  onAdd: (s: Suggestion) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="menu-card"
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px",
        borderRadius: "12px",
        cursor: "pointer",
        minWidth: "240px",
        maxWidth: "280px",
        flexShrink: 0,
      }}
    >
      {suggestion.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={suggestion.image_url}
          alt={suggestion.name}
          style={{
            width: 56,
            height: 56,
            borderRadius: "8px",
            objectFit: "cover",
            flexShrink: 0,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {suggestion.name}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {suggestion.reason}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--accent)",
            }}
          >
            ₹{suggestion.price}
          </span>
          <button
            className="btn-glow"
            style={{ padding: "5px 12px", fontSize: "0.75rem", borderRadius: "8px" }}
            onClick={() => onAdd(suggestion)}
          >
            + Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: "8px",
      }}
    >
      {/* Agent panel for AI messages */}
      {!isUser && msg.agentEvents && msg.agentEvents.length > 0 && (
        <div style={{ width: "100%" }}>
          <AgentPanel events={msg.agentEvents} />
        </div>
      )}

      {/* Bubble */}
      {msg.isLoading ? (
        <div className="chat-bubble-ai">
          <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "2px 0" }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      ) : (
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
          <p style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{msg.content}</p>
        </div>
      )}

      {/* Suggestion cards */}
      {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "4px",
            width: "100%",
            paddingRight: "4px",
          }}
        >
          {msg.suggestions.map((s) => (
            <SuggestionCard
              key={s.itemId}
              suggestion={s}
              onAdd={(sug) => {
                const store = useDiningStore.getState();
                if (!store.sessionId) return;
                const fakeItem: MenuItem = {
                  id: sug.itemId,
                  name: sug.name,
                  price: sug.price,
                  description: sug.reason,
                  image_url: sug.image_url || "",
                  category: "",
                  tags: [],
                  allergens: [],
                  available: true,
                  popular_score: 0,
                  complementary_items: [],
                  is_chef_special: false,
                  is_combo_eligible: false,
                };
                store.addToCart(fakeItem);
                store.addToast(`${sug.name} added to cart! 🛒`);
                apiAddToCart(store.sessionId!, {
                  item_id: sug.itemId,
                  quantity: 1,
                  added_by: store.userName,
                  table_id: store.tableId,
                }).then((res) => {
                  if (res.upsell) store.setUpsell(res.upsell);
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Timestamp */}
      {!msg.isLoading && (
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </motion.div>
  );
}

export function ChatWindow() {
  const {
    messages, addMessage, updateLastMessage,
    chatOpen, toggleChat,
    sessionId, tableId, userName, cart, preferences,
    setAIThinking, isAIThinking,
    addToCart, addToast, setUpsell,
    mergePreferences, language,
  } = useDiningStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!chatOpen && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setUnreadCount((n) => n + 1);
    }
  }, [messages, chatOpen]);

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatOpen]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isAIThinking || !sessionId) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Math.random().toString(36),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    addMessage(userMsg);

    // Add loading placeholder
    const loadingId = Math.random().toString(36);
    addMessage({
      id: loadingId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
      agentEvents: [],
    });
    setAIThinking(true);

    try {
      const res = await sendChatMessage(sessionId, {
        message: msg,
        table_id: tableId,
        user_name: userName,
        cart,
        preferences,
      });

      // Handle auto add-to-cart action
      if (res.action === "add_to_cart" && res.action_data?.item) {
        const item = res.action_data.item as MenuItem;
        addToCart(item);
        addToast(`${item.name} added to cart! 🛒`);
        apiAddToCart(sessionId, {
          item_id: item.id,
          quantity: 1,
          added_by: userName,
          table_id: tableId,
        }).then((cartRes) => {
          if (cartRes.upsell) setUpsell(cartRes.upsell);
        });
      }

      // Merge inferred preferences into session
      if (res.intent) {
        // Infer preferences from agent events
      }

      updateLastMessage({
        content: res.message || "I'm here to help! 😊",
        suggestions: res.suggestions || [],
        agentEvents: res.agent_events || [],
        isLoading: false,
        action: res.action,
        actionData: res.action_data,
      });
    } catch {
      updateLastMessage({
        content: "Oops! Connection issue. Please try again. 🙏",
        isLoading: false,
      });
    } finally {
      setAIThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input
  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      addToast("Voice not supported in this browser", "warning");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (e: { results: { transcript: string }[][] }) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  return (
    <>
      {/* ── Floating Chat Button ── */}
      <motion.button
        id="chat-toggle-btn"
        onClick={toggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          boxShadow: "0 8px 32px rgba(249,115,22,0.45)",
          zIndex: 1000,
          flexDirection: "column",
        }}
      >
        {chatOpen ? "✕" : "💬"}
        {unreadCount > 0 && !chatOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#22c55e",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-primary)",
            }}
          >
            {unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* ── Chat Drawer ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            id="chat-drawer"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="glass-strong"
            style={{
              position: "fixed",
              bottom: "90px",
              right: "16px",
              width: "min(420px, calc(100vw - 32px))",
              height: "min(600px, calc(100dvh - 120px))",
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "20px",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f97316, #fbbf24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                🧑‍🍳
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>Zara</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {isAIThinking ? (
                    <span style={{ color: "var(--accent)" }}>thinking...</span>
                  ) : (
                    "AI Dining Assistant · Online"
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    marginTop: "40px",
                  }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>👋</div>
                  <p>Ask Zara anything about the menu!</p>
                  <p style={{ marginTop: "4px", fontSize: "0.78rem" }}>
                    Try: &ldquo;What&apos;s spicy and light?&rdquo;
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                padding: "10px 16px 0",
                flexShrink: 0,
              }}
            >
              {QUICK_SUGGESTIONS.map((qs) => (
                <button
                  key={qs.label}
                  className="chip"
                  onClick={() => handleSend(qs.message)}
                  disabled={isAIThinking}
                >
                  {qs.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                id="chat-input"
                className="input-dark"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Zara... (try Hinglish!)"
                disabled={isAIThinking}
                style={{ flex: 1 }}
              />
              <button
                onClick={handleVoice}
                title="Voice input"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                🎤
              </button>
              <button
                id="chat-send-btn"
                className="btn-glow"
                onClick={() => handleSend()}
                disabled={!input.trim() || isAIThinking}
                style={{
                  width: "42px",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  opacity: !input.trim() || isAIThinking ? 0.5 : 1,
                }}
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
