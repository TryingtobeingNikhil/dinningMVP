"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDiningStore } from "@/store/useStore";
import { addToCart as apiAddToCart } from "@/lib/api";
import type { MenuItem } from "@/types";

const CATEGORIES = [
  "All", "Veg Starters", "Non-Veg Starters",
  "Mains (Veg)", "Mains (Non-Veg)",
  "Breads & Rice", "Sides", "Desserts",
  "Beverages (Hot)", "Beverages (Cold)", "Combos & Deals",
];

const TAG_FILTERS = [
  { label: "🌶️ Spicy", value: "spicy" },
  { label: "🥗 Light", value: "light" },
  { label: "⭐ Bestseller", value: "bestseller" },
  { label: "🌱 Veg", value: "veg" },
  { label: "🍗 Non-Veg", value: "non-veg" },
  { label: "👨‍🍳 Chef Special", value: "chef_special" },
  { label: "🔥 Quick", value: "quick-serve" },
];

function MenuItemCard({ item }: { item: MenuItem }) {
  const { addToCart, sessionId, userName, tableId, addToast, setUpsell } = useDiningStore();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (!item.available || adding) return;
    setAdding(true);
    addToCart(item, userName);
    setAdded(true);
    addToast(`${item.name} added! 🛒`);
    setTimeout(() => setAdded(false), 2000);

    if (sessionId) {
      try {
        const res = await apiAddToCart(sessionId, {
          item_id: item.id,
          quantity: 1,
          added_by: userName,
          table_id: tableId,
        });
        if (res.upsell) setUpsell(res.upsell);
      } catch {
        // Optimistic update already done
      }
    }
    setAdding(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="menu-card"
      style={{ opacity: item.available ? 1 : 0.5 }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80`;
          }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 40%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Badges */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {item.is_chef_special && (
            <span className="badge badge-orange">👨‍🍳 Chef&apos;s Pick</span>
          )}
          {item.tags.includes("bestseller") && (
            <span className="badge badge-green">⭐ Bestseller</span>
          )}
          {!item.available && (
            <span
              className="badge"
              style={{ background: "rgba(0,0,0,0.7)", color: "#999" }}
            >
              Unavailable
            </span>
          )}
        </div>
        {/* Price on image */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            background: "rgba(10,10,10,0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "8px",
            padding: "4px 10px",
            fontSize: "0.85rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          ₹{item.price}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px" }}>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            marginBottom: "4px",
            color: "var(--text-primary)",
          }}
        >
          {item.name}
        </div>
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            marginBottom: "10px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {item.description}
        </p>

        {/* Tags */}
        <div
          style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}
        >
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.68rem",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "var(--bg-glass)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {tag}
            </span>
          ))}
          {item.calories && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "rgba(34,197,94,0.08)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              {item.calories} cal
            </span>
          )}
        </div>

        {/* Add button */}
        <button
          id={`add-btn-${item.id}`}
          className="btn-glow"
          onClick={handleAdd}
          disabled={!item.available || adding}
          style={{
            width: "100%",
            padding: "10px",
            opacity: !item.available ? 0.5 : 1,
            background: added
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : undefined,
            boxShadow: added
              ? "0 4px 24px rgba(34,197,94,0.35)"
              : undefined,
          }}
        >
          {added ? "✓ Added" : adding ? "..." : "Add to Cart"}
        </button>
      </div>
    </motion.div>
  );
}

export function MenuGrid({ popularItems }: { popularItems?: MenuItem[] }) {
  const { menuItems, activeCategory, setActiveCategory, searchQuery, setSearchQuery } =
    useDiningStore();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== "All") {
      items = items.filter((i) => i.category === activeCategory);
    }
    if (activeTag) {
      if (activeTag === "chef_special") {
        items = items.filter((i) => i.is_chef_special);
      } else {
        items = items.filter((i) => i.tags.includes(activeTag));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [menuItems, activeCategory, activeTag, searchQuery]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>
      {/* Search */}
      <div style={{ padding: "16px 0 12px" }}>
        <input
          id="menu-search"
          className="input-dark"
          placeholder="🔍 Search menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tag filters */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "12px",
        }}
      >
        {TAG_FILTERS.map((tf) => (
          <button
            key={tf.value}
            className={`chip ${activeTag === tf.value ? "active" : ""}`}
            onClick={() => setActiveTag(activeTag === tf.value ? null : tf.value)}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "20px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              border: activeCategory === cat ? "1px solid rgba(249,115,22,0.5)" : "1px solid var(--border)",
              background: activeCategory === cat ? "var(--accent-dim)" : "var(--bg-glass)",
              color: activeCategory === cat ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: "0.82rem",
              fontWeight: activeCategory === cat ? 600 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              boxShadow: activeCategory === cat ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(249,115,22,0.1)" : "none",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* AI Pick for You */}
      {activeCategory === "All" && !searchQuery && !activeTag && popularItems && popularItems.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              ✨ AI Pick for You
            </span>
            <span
              className="badge badge-orange"
              style={{ fontSize: "0.65rem" }}
            >
              Zara&apos;s Picks
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            {popularItems.slice(0, 3).map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          marginBottom: "14px",
        }}
      >
        {filtered.length} {filtered.length === 1 ? "item" : "items"}
        {searchQuery && ` for "${searchQuery}"`}
      </div>

      {/* Items grid */}
      <motion.div
        layout
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🍽️</div>
          <p>No items found. Try asking Zara instead! 💬</p>
        </div>
      )}
    </div>
  );
}
