"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDiningStore } from "@/store/useStore";
import { getTableSession, getMenu, getPopularItems, sendChatMessage } from "@/lib/api";
import { useWebSocket } from "@/lib/websocket";
import { ChatWindow } from "@/components/ChatWindow";
import { MenuGrid } from "@/components/MenuGrid";
import { CartSidebar } from "@/components/CartSidebar";
import { UpsellBanner, GroupBanner, ToastContainer, LanguageToggle } from "@/components/UI";
import type { MenuItem, ChatMessage } from "@/types";

// ── Onboarding modal ─────────────────────────────────────────────────────────
function OnboardingModal({
  tableId,
  onComplete,
}: {
  tableId: string;
  onComplete: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "mood">("name");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { mergePreferences } = useDiningStore();

  const moods = [
    { label: "Just browsing 👀", pref: {} },
    { label: "I'm starving! 🍽️", pref: { light: false } },
    { label: "Light bite 🥗", pref: { light: true } },
    { label: "Spice me up 🌶️", pref: { spicy: true } },
    { label: "Surprise me! ✨", pref: {} },
  ];

  const handleNameNext = () => {
    if (!name.trim()) return;
    setStep("mood");
  };

  const handleMoodSelect = (mood: typeof moods[0]) => {
    setSelectedMood(mood.label);
    mergePreferences(mood.pref);
    setTimeout(() => onComplete(name.trim() || "Guest"), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg-primary)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "20%",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ width: "min(420px, 100%)", position: "relative", zIndex: 1 }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🍽️</div>
          <h1
            className="gradient-text"
            style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "4px" }}
          >
            Spice Garden
          </h1>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Table {tableId} · Powered by AI
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass"
              style={{ padding: "24px", borderRadius: "20px" }}
            >
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>
                👋 Welcome!
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginBottom: "20px",
                }}
              >
                What should Zara call you?
              </div>
              <input
                id="onboarding-name"
                className="input-dark"
                placeholder="Your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                autoFocus
              />
              <button
                className="btn-glow"
                style={{ width: "100%", padding: "14px", marginTop: "14px" }}
                onClick={handleNameNext}
                disabled={!name.trim()}
              >
                Continue →
              </button>
              <button
                className="btn-ghost"
                style={{ width: "100%", marginTop: "8px" }}
                onClick={() => onComplete("Guest")}
              >
                Skip
              </button>
            </motion.div>
          )}

          {step === "mood" && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass"
              style={{ padding: "24px", borderRadius: "20px" }}
            >
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>
                Hey {name}! 🎉
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginBottom: "20px",
                }}
              >
                What&apos;s the vibe today?
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => handleMoodSelect(mood)}
                    style={{
                      background:
                        selectedMood === mood.label
                          ? "var(--accent-dim)"
                          : "var(--bg-glass)",
                      border: `1px solid ${
                        selectedMood === mood.label
                          ? "var(--border-glow)"
                          : "var(--border)"
                      }`,
                      borderRadius: "12px",
                      padding: "13px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Main Table Page ───────────────────────────────────────────────────────────
export default function TablePage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const {
    setSession, setMenuItems, addMessage,
    sessionId, userName,
  } = useDiningStore();

  const [ready, setReady] = useState(false);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);

  // Connect WebSocket after session is ready
  useWebSocket(
    ready ? tableId : "__disabled__",
    ready ? userName : "__disabled__"
  );

  const handleOnboardingComplete = async (name: string) => {
    try {
      // Get session from backend
      const sessionData = await getTableSession(tableId, name);
      setSession(sessionData.session_id, tableId, name);

      // Load menu
      const menuData = await getMenu();
      setMenuItems(menuData.items || []);

      // Load popular items
      const hour = new Date().getHours();
      const timeOfDay =
        hour < 12 ? "breakfast" : hour < 16 ? "lunch" : hour < 20 ? "evening" : "dinner";
      const popularData = await getPopularItems(timeOfDay);
      setPopularItems(popularData.items || []);

      setReady(true);

      // Trigger Greeter Agent
      const greetRes = await sendChatMessage(sessionData.session_id, {
        message: "hello",
        table_id: tableId,
        user_name: name,
        cart: [],
        preferences: {},
      });

      const greetMsg: ChatMessage = {
        id: Math.random().toString(36),
        role: "assistant",
        content: greetRes.message || `Hey ${name}! I'm Zara 👋 Welcome to Spice Garden! What are you in the mood for today? ✨`,
        timestamp: new Date(),
        suggestions: greetRes.suggestions || [],
        agentEvents: greetRes.agent_events || [],
      };
      addMessage(greetMsg);
    } catch (err) {
      console.error("Session init failed:", err);
      // Fallback — still show the app
      setReady(true);
      addMessage({
        id: "fallback",
        role: "assistant",
        content: `Hey ${name}! I'm Zara 👋 Welcome to Spice Garden! Ask me anything about the menu 🍽️`,
        timestamp: new Date(),
      });
    }
  };

  if (!ready) {
    return <OnboardingModal tableId={tableId} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {/* ── Top bar ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 800,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🍽️</span>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>Spice Garden</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Table {tableId} · {userName}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LanguageToggle />
          {/* Cart button rendered inside CartSidebar */}
        </div>
      </header>

      {/* ── Group banner ── */}
      <GroupBanner />

      {/* ── Main content ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <MenuGrid popularItems={popularItems} />
      </main>

      {/* ── Overlays ── */}
      <CartSidebar />
      <ChatWindow />
      <UpsellBanner />
      <ToastContainer />
    </div>
  );
}
