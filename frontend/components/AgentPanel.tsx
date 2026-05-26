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
      initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: isThinking
          ? "linear-gradient(90deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.02) 100%)"
          : isDone
          ? "rgba(255,255,255,0.02)"
          : "transparent",
        border: `1px solid ${
          isThinking
            ? "rgba(249,115,22,0.3)"
            : isDone
            ? "rgba(255,255,255,0.05)"
            : "transparent"
        }`,
        boxShadow: isThinking ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(249,115,22,0.1)" : "none",
        transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Status indicator */}
      <div style={{ width: 22, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {isThinking ? (
          <span className="agent-thinking" />
        ) : isDone ? (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ fontSize: "12px", filter: "grayscale(100%) brightness(200%)" }}
          >
            ✓
          </motion.span>
        ) : (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border)", display: "inline-block" }} />
        )}
      </div>

      {/* Icon + Name */}
      <span style={{ fontSize: "14px", filter: isDone ? "grayscale(40%)" : "none" }}>{icon}</span>
      <span
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: isThinking
            ? "var(--text-primary)"
            : isDone
            ? "var(--text-secondary)"
            : "var(--text-muted)",
          letterSpacing: "-0.01em",
          flex: 1,
        }}
      >
        {event.agent}
      </span>

      {/* Result or timing */}
      {isDone && event.ms && (
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", letterSpacing: "-0.05em" }}>
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
  const isAnyThinking = events.some((e) => e.status === "thinking");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{
        padding: "16px",
        marginBottom: "12px",
        borderRadius: "16px",
        border: `1px solid ${isAnyThinking ? 'rgba(249,115,22,0.3)' : 'var(--border)'}`,
        boxShadow: isAnyThinking ? '0 0 30px -10px rgba(249,115,22,0.15)' : 'none',
        transition: 'all 0.5s ease',
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--border)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "var(--accent)" }}>↳</span>
            <span style={{ 
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {lastDone.result}
            </span>
          </motion.div>
        );
      })()}
    </motion.div>
  );
}
