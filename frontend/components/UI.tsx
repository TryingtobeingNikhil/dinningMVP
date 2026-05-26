"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useDiningStore } from "@/store/useStore";
import { addToCart as apiAddToCart } from "@/lib/api";

export function UpsellBanner() {
  const { upsellSuggestion, setUpsell, addToCart, addToast, sessionId, userName, tableId } =
    useDiningStore();

  if (!upsellSuggestion) return null;

  const item = upsellSuggestion.suggestion_item;

  const handleAdd = async () => {
    addToCart(item as Parameters<typeof addToCart>[0]);
    addToast(`${item.name} added! 🛒`);
    setUpsell(null);
    if (sessionId) {
      await apiAddToCart(sessionId, {
        item_id: item.id,
        quantity: 1,
        added_by: userName,
        table_id: tableId,
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        id="upsell-banner"
        style={{
          position: "fixed",
          bottom: "96px",
          left: "16px",
          right: "90px",
          zIndex: 990,
          background: "rgba(22,22,22,0.95)",
          border: "1px solid var(--border-glow)",
          borderRadius: "16px",
          padding: "14px 16px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          boxShadow: "0 8px 32px rgba(249,115,22,0.2)",
          backdropFilter: "blur(20px)",
        }}
      >
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              objectFit: "cover",
              flexShrink: 0,
            }}
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "2px" }}>
            ✨ Zara suggests
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {upsellSuggestion.message}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button
            className="btn-glow"
            style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "8px", whiteSpace: "nowrap" }}
            onClick={handleAdd}
          >
            + Add ₹{item.price}
          </button>
          <button
            onClick={() => setUpsell(null)}
            style={{
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
            }}
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function GroupBanner() {
  const { groupUsers, tableId } = useDiningStore();

  if (groupUsers.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        background: "var(--bg-glass)",
        borderBottom: "1px solid var(--border)",
        fontSize: "0.82rem",
      }}
    >
      {/* Avatar stack */}
      <div style={{ display: "flex" }}>
        {groupUsers.slice(0, 4).map((user, i) => (
          <div
            key={user.name}
            className="avatar"
            style={{
              background: user.color,
              color: "#fff",
              marginLeft: i > 0 ? "-8px" : 0,
              zIndex: groupUsers.length - i,
              fontSize: "0.7rem",
            }}
            title={user.name}
          >
            {user.initials}
          </div>
        ))}
      </div>
      <span style={{ color: "var(--text-secondary)" }}>
        <strong style={{ color: "var(--text-primary)" }}>{groupUsers.length} people</strong> at Table {tableId}
      </span>
      <span className="badge badge-green" style={{ marginLeft: "auto" }}>
        🟢 Live
      </span>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useDiningStore();

  return (
    <div
      style={{
        position: "fixed",
        top: "70px",
        right: "16px",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="toast"
            onClick={() => removeToast(toast.id)}
            style={{
              background: "rgba(22,22,22,0.95)",
              border: `1px solid ${
                toast.type === "success"
                  ? "rgba(34,197,94,0.3)"
                  : toast.type === "warning"
                  ? "rgba(249,115,22,0.3)"
                  : "var(--border)"
              }`,
              borderRadius: "12px",
              padding: "10px 16px",
              fontSize: "0.85rem",
              color: "var(--text-primary)",
              backdropFilter: "blur(20px)",
              pointerEvents: "auto",
              cursor: "pointer",
              maxWidth: "300px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useDiningStore();

  const langs: Array<{ code: "en" | "hi" | "te"; label: string }> = [
    { code: "en", label: "EN" },
    { code: "hi", label: "हि" },
    { code: "te", label: "తె" },
  ];

  return (
    <div
      id="language-toggle"
      style={{
        display: "flex",
        gap: "2px",
        background: "var(--bg-glass)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "3px",
      }}
    >
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          style={{
            padding: "4px 10px",
            borderRadius: "7px",
            border: "none",
            background: language === l.code ? "var(--accent)" : "transparent",
            color: language === l.code ? "#fff" : "var(--text-muted)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
