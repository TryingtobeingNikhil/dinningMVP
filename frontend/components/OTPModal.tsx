"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDiningStore } from "@/store/useStore";
import { sendOTP, verifyOTP, placeOrder } from "@/lib/api";
import { OrderConfirmation } from "./OrderConfirmation";
import confetti from "canvas-confetti";

type Step = "details" | "otp" | "validating";

export function OTPModal({ onClose }: { onClose: () => void }) {
  const { sessionId, tableId, cart, clearCart, setCurrentOrder, addToast } =
    useDiningStore();

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<unknown | null>(null);

  const handleSendOTP = async () => {
    if (!name.trim() || phone.length < 10) {
      setError("Please enter a valid name and 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await sendOTP(phone, sessionId || "demo");
      setDemoOtp(res.demo_otp || null);
      setStep("otp");
      addToast("OTP sent! Check the demo OTP below 📱", "info");
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    setStep("validating");

    try {
      const verifyRes = await verifyOTP(phone, otp, sessionId || "demo", name);
      if (!verifyRes.success) {
        setError(verifyRes.error || "Invalid OTP");
        setStep("otp");
        setLoading(false);
        return;
      }

      const orderRes = await placeOrder(sessionId || "demo", {
        table_id: tableId,
        customer_name: name,
        customer_phone: phone,
        cart,
      });

      setOrder(orderRes);
      clearCart();

      // 🎉 Confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f97316", "#fbbf24", "#22c55e", "#3b82f6"],
      });

      addToast(`Order ${orderRes.order_id} confirmed! 🎉`, "success");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  if (order) {
    return (
      <OrderConfirmation
        order={order as unknown as Parameters<typeof OrderConfirmation>[0]["order"]}
        onClose={onClose}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step !== "validating" ? onClose : undefined}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 30, filter: "blur(10px)" }}
          animate={{ scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ scale: 0.95, y: 30, filter: "blur(10px)" }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong"
          style={{
            width: "min(420px, 100%)",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, rgba(249,115,22,0.1), transparent)",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {step === "details" && "📋 Order Details"}
              {step === "otp" && "📱 Verify OTP"}
              {step === "validating" && "⚙️ Placing Order..."}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              {step === "details" && `${cart.length} items · ₹${cart.reduce((s, i) => s + i.price * i.quantity, 0)}`}
              {step === "otp" && `Sent to ${phone.slice(0, 2)}****${phone.slice(-2)}`}
              {step === "validating" && "Running Order Validation Agent..."}
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Step 1: Details */}
            {step === "details" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>
                    Your Name
                  </label>
                  <input
                    id="customer-name"
                    className="input-dark"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>
                    Phone Number
                  </label>
                  <input
                    id="customer-phone"
                    className="input-dark"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    type="tel"
                  />
                </div>
                {error && (
                  <p style={{ color: "var(--red)", fontSize: "0.82rem" }}>{error}</p>
                )}
                <button
                  id="send-otp-btn"
                  className="btn-glow"
                  style={{ width: "100%", padding: "14px", marginTop: "4px" }}
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send OTP →"}
                </button>
              </div>
            )}

            {/* Step 2: OTP */}
            {step === "otp" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Demo OTP display */}
                {demoOtp && (
                  <div
                    style={{
                      background: "var(--accent-dim)",
                      border: "1px solid var(--border-glow)",
                      borderRadius: "12px",
                      padding: "14px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--accent)", marginBottom: "6px" }}>
                      📱 Demo OTP (sent to your phone)
                    </div>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        letterSpacing: "0.2em",
                        color: "var(--text-primary)",
                      }}
                    >
                      {demoOtp}
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>
                    Enter 6-digit OTP
                  </label>
                  <input
                    id="otp-input"
                    className="input-dark"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.3em" }}
                    type="tel"
                  />
                </div>
                {error && (
                  <p style={{ color: "var(--red)", fontSize: "0.82rem" }}>{error}</p>
                )}
                <button
                  id="verify-otp-btn"
                  className="btn-glow"
                  style={{ width: "100%", padding: "14px" }}
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Place Order 🎉"}
                </button>
                <button
                  className="btn-ghost"
                  style={{ width: "100%" }}
                  onClick={() => { setStep("details"); setOtp(""); setError(""); }}
                >
                  ← Change number
                </button>
              </div>
            )}

            {/* Step 3: Validating */}
            {step === "validating" && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚙️</div>
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                  Running Order Validation Agent
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                  Checking stock, applying business rules...
                </div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
