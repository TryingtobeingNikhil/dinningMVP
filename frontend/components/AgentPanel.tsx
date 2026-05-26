"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useDiningStore } from "@/store/useStore";
import type { AgentEvent } from "@/types";

const AGENT_ICONS: Record<string, string> = {
  "Multilingual NLU": "🌐",
  "Greeter Agent": "👋",
  "Context Memory": "🧠",
  "Recommendation Agent": "🔍",
  "Order Agent": "🛒",
  "Upsell Agent": "✨",
  "Checkout Agent": "💳",
  "General Agent": "💬",
};

function AgentRow({ event, index }: { event: AgentEvent; index: number }) {
  const icon = AGENT_ICONS[event.agent] || "🤖";
  const isDone = event.status === "done";
  const isThinking = event.status === "thinking";

  return (
    <motion.div
      key={event.agent}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderRadius: "10px",
        background: isThinking
          ? "rgba(249,115,22,0.06)"
          : isDone
          ? "rgba(34,197,94,0.04)"
          : "transparent",
        border: `1px solid ${
          isThinking
            ? "rgba(249,115,22,0.2)"
            : isDone
            ? "rgba(34,197,94,0.12)"
            : "transparent"
        }`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Status indicator */}
      <div style={{ width: 20, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {isThinking ? (
          <span className="agent-thinking" />
        ) : isDone ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ fontSize: "12px" }}
          >
            ✅
          </motion.span>
        ) : (
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
        )}
      </div>

      {/* Icon + Name */}
      <span style={{ fontSize: "13px" }}>{icon}</span>
      <span
        style={{
          fontSize: "0.8rem",
          fontWeight: 500,
          color: isThinking
            ? "var(--accent-light)"
            : isDone
            ? "var(--text-secondary)"
            : "var(--text-muted)",
          flex: 1,
        }}
      >
        {event.agent}
      </span>

      {/* Result or timing */}
      {isDone && event.ms && (
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
          {event.ms}ms
        </span>
      )}

      {isThinking && (
        <span style={{ fontSize: "0.7rem", color: "var(--accent)", opacity: 0.7 }}>
          thinking...
        </span>
      )}
    </motion.div>
  );
}

export function AgentPanel({ events }: { events: AgentEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{
        padding: "12px",
        marginBottom: "10px",
        borderRadius: "12px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: "12px" }}>🤖</span>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          AI Orchestration
        </span>
        {events.some((e) => e.status === "thinking") && (
          <div style={{ display: "flex", gap: "3px", marginLeft: "auto" }}>
            <span className="typing-dot" style={{ width: 5, height: 5 }} />
            <span className="typing-dot" style={{ width: 5, height: 5 }} />
            <span className="typing-dot" style={{ width: 5, height: 5 }} />
          </div>
        )}
      </div>

      {/* Agent rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <AnimatePresence mode="popLayout">
          {events.map((event, i) => (
            <AgentRow key={`${event.agent}-${i}`} event={event} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Result preview of last done agent */}
      {(() => {
        const lastDone = [...events].reverse().find((e) => e.status === "done" && e.result);
        if (!lastDone) return null;
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid var(--border)",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              fontFamily: "monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            → {lastDone.result}
          </motion.div>
        );
      })()}
    </motion.div>
  );
}
