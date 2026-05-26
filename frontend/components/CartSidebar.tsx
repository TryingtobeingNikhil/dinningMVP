"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDiningStore } from "@/store/useStore";
import { OTPModal } from "./OTPModal";

export function CartSidebar() {
  const {
    cart, cartOpen, toggleCart,
    updateCartItem, removeFromCart,
  } = useDiningStore();

  const [showOTP, setShowOTP] = useState(false);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      {/* Cart button (top-right) */}
      <button
        id="cart-btn"
        onClick={toggleCart}
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "10px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 900,
          color: "var(--text-primary)",
          fontSize: "0.9rem",
          fontWeight: 600,
          transition: "all 0.2s",
        }}
      >
        🛒
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="cart-pop"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "999px",
              padding: "1px 8px",
              fontSize: "0.78rem",
            }}
          >
            {itemCount}
          </motion.span>
        )}
        {total > 0 && (
          <span style={{ color: "var(--accent)", fontSize: "0.85rem" }}>
            ₹{total}
          </span>
        )}
      </button>

      {/* Sidebar overlay */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleCart}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 950,
              }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              id="cart-sidebar"
              className="glass-strong"
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(400px, 100vw)",
                zIndex: 960,
                display: "flex",
                flexDirection: "column",
                borderRadius: "20px 0 0 20px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Your Cart 🛒
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <button
                  onClick={toggleCart}
                  style={{
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Items */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                {cart.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛒</div>
                    <p>Your cart is empty</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "6px" }}>
                      Ask Zara for recommendations!
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.item_id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "12px 0",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {item.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name}
                            style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                            {item.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              marginBottom: "8px",
                            }}
                          >
                            Added by {item.added_by === useDiningStore.getState().userName ? "You" : item.added_by}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            {/* Quantity stepper */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "var(--bg-glass)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                padding: "4px",
                              }}
                            >
                              <button
                                onClick={() => updateCartItem(item.item_id, item.quantity - 1)}
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "var(--bg-secondary)",
                                  color: "var(--text-primary)",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                }}
                              >
                                −
                              </button>
                              <span style={{ fontSize: "0.9rem", fontWeight: 600, minWidth: "20px", textAlign: "center" }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartItem(item.item_id, item.quantity + 1)}
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "var(--accent)",
                                  color: "#fff",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                }}
                              >
                                +
                              </button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                                ₹{item.price * item.quantity}
                              </span>
                              <button
                                onClick={() => removeFromCart(item.item_id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--text-muted)",
                                  fontSize: "16px",
                                }}
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer with total */}
              {cart.length > 0 && (
                <div
                  style={{
                    padding: "16px 20px",
                    borderTop: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>GST (5%)</span>
                    <span>₹{tax}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                    }}
                  >
                    <span>Total</span>
                    <span className="gradient-text">₹{total}</span>
                  </div>
                  <button
                    id="place-order-btn"
                    className="btn-glow"
                    style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                    onClick={() => {
                      toggleCart();
                      setShowOTP(true);
                    }}
                  >
                    Place Order →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showOTP && <OTPModal onClose={() => setShowOTP(false)} />}
    </>
  );
}
