"use client";
import { motion } from "framer-motion";
import type { Order } from "@/types";

const STATUS_STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: "✅", desc: "Your order is in the queue" },
  { key: "preparing", label: "Being Prepared", icon: "👨‍🍳", desc: "Kitchen is working on it" },
  { key: "ready", label: "Ready to Serve", icon: "🍽️", desc: "Coming to your table soon" },
  { key: "delivered", label: "Enjoy your meal!", icon: "🎉", desc: "Bon appétit!" },
];

export function OrderConfirmation({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="glass-strong"
        style={{
          width: "min(440px, 100%)",
          borderRadius: "24px",
          overflow: "hidden",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "28px 24px 20px",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(34,197,94,0.06))",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            style={{ fontSize: "56px", marginBottom: "12px" }}
          >
            🎉
          </motion.div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "4px" }}>
            Order Confirmed!
          </div>
          <div
            style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              fontFamily: "monospace",
            }}
          >
            {order.order_id}
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Order timeline */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "16px",
              }}
            >
              Order Status
            </div>
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    marginBottom: "12px",
                  }}
                >
                  {/* Timeline line */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: isCurrent
                          ? "var(--accent)"
                          : isDone
                          ? "rgba(34,197,94,0.2)"
                          : "var(--bg-glass)",
                        border: `2px solid ${
                          isCurrent
                            ? "var(--accent)"
                            : isDone
                            ? "rgba(34,197,94,0.4)"
                            : "var(--border)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        boxShadow: isCurrent
                          ? "0 0 16px rgba(249,115,22,0.4)"
                          : "none",
                      }}
                    >
                      {step.icon}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        style={{
                          width: "2px",
                          height: "20px",
                          background: isDone && i < currentStepIndex
                            ? "rgba(34,197,94,0.3)"
                            : "var(--border)",
                          marginTop: "4px",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingTop: "4px" }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent
                          ? "var(--text-primary)"
                          : isDone
                          ? "var(--text-secondary)"
                          : "var(--text-muted)",
                      }}
                    >
                      {step.label}
                    </div>
                    {isCurrent && (
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {step.desc}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Wait time */}
          <div
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--accent)", marginBottom: "4px" }}>
              Estimated Wait Time
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {order.estimated_wait_minutes} mins
            </div>
          </div>

          {/* Order summary */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "10px",
              }}
            >
              Order Summary
            </div>
            {order.items?.map((item) => (
              <div
                key={item.item_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.87rem",
                  padding: "4px 0",
                  color: "var(--text-secondary)",
                }}
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1rem",
                fontWeight: 700,
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span>Total Paid</span>
              <span className="gradient-text">₹{order.total}</span>
            </div>
          </div>

          <button
            className="btn-glow"
            style={{ width: "100%", padding: "14px" }}
            onClick={onClose}
          >
            ✓ Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
