"use client";
import { create } from "zustand";
import type {
  CartItem,
  ChatMessage,
  MenuItem,
  SessionUser,
  UpsellSuggestion,
  Order,
  Language,
} from "@/types";

// Avatar colors for group members
const AVATAR_COLORS = [
  "#f97316", "#22c55e", "#3b82f6", "#a855f7",
  "#ec4899", "#14b8a6", "#f59e0b", "#ef4444",
];

function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface DiningStore {
  // Session
  sessionId: string | null;
  tableId: string;
  userName: string;
  language: Language;

  // Menu
  menuItems: MenuItem[];
  activeCategory: string;
  searchQuery: string;

  // Cart
  cart: CartItem[];
  cartOpen: boolean;

  // Chat
  messages: ChatMessage[];
  chatOpen: boolean;
  isAIThinking: boolean;

  // Group
  groupUsers: SessionUser[];

  // UI
  upsellSuggestion: UpsellSuggestion | null;
  toasts: Array<{ id: string; message: string; type: "success" | "info" | "warning" }>;
  currentOrder: Order | null;
  showOrderConfirmation: boolean;
  preferences: Record<string, unknown>;

  // Actions
  setSession: (sessionId: string, tableId: string, userName: string) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
  setLanguage: (lang: Language) => void;

  addToCart: (item: MenuItem, addedBy?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  setCart: (cart: CartItem[]) => void;
  toggleCart: () => void;
  clearCart: () => void;

  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (update: Partial<ChatMessage>) => void;
  toggleChat: () => void;
  setAIThinking: (thinking: boolean) => void;

  addGroupUser: (name: string) => void;
  removeGroupUser: (name: string) => void;
  setGroupUsers: (names: string[]) => void;

  setUpsell: (upsell: UpsellSuggestion | null) => void;
  addToast: (message: string, type?: "success" | "info" | "warning") => void;
  removeToast: (id: string) => void;
  setCurrentOrder: (order: Order | null) => void;
  setShowOrderConfirmation: (show: boolean) => void;
  setPreferences: (prefs: Record<string, unknown>) => void;
  mergePreferences: (prefs: Record<string, unknown>) => void;
}

export const useDiningStore = create<DiningStore>((set, get) => ({
  // Session
  sessionId: null,
  tableId: "T1",
  userName: "Guest",
  language: "en",

  // Menu
  menuItems: [],
  activeCategory: "All",
  searchQuery: "",

  // Cart
  cart: [],
  cartOpen: false,

  // Chat
  messages: [],
  chatOpen: false,
  isAIThinking: false,

  // Group
  groupUsers: [],

  // UI
  upsellSuggestion: null,
  toasts: [],
  currentOrder: null,
  showOrderConfirmation: false,
  preferences: {},

  // ─── Session ───────────────────────────────────────────────────────────
  setSession: (sessionId, tableId, userName) => {
    const user: SessionUser = {
      name: userName,
      color: generateColor(userName),
      initials: getInitials(userName),
    };
    set({ sessionId, tableId, userName, groupUsers: [user] });
  },

  // ─── Menu ──────────────────────────────────────────────────────────────
  setMenuItems: (items) => set({ menuItems: items }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLanguage: (lang) => set({ language: lang }),

  // ─── Cart ──────────────────────────────────────────────────────────────
  addToCart: (item, addedBy) => {
    const { cart, userName } = get();
    const by = addedBy || userName;
    const existing = cart.find((ci) => ci.item_id === item.id);
    if (existing) {
      set({ cart: cart.map((ci) => ci.item_id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci) });
    } else {
      set({
        cart: [...cart, {
          item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          added_by: by,
          image_url: item.image_url,
        }],
      });
    }
  },
  removeFromCart: (itemId) =>
    set({ cart: get().cart.filter((ci) => ci.item_id !== itemId) }),
  updateCartItem: (itemId, quantity) => {
    if (quantity <= 0) return get().removeFromCart(itemId);
    set({ cart: get().cart.map((ci) => ci.item_id === itemId ? { ...ci, quantity } : ci) });
  },
  setCart: (cart) => set({ cart }),
  toggleCart: () => set({ cartOpen: !get().cartOpen }),
  clearCart: () => set({ cart: [] }),

  // ─── Chat ──────────────────────────────────────────────────────────────
  addMessage: (msg) => set({ messages: [...get().messages, msg] }),
  updateLastMessage: (update) => {
    const msgs = [...get().messages];
    if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...update };
    set({ messages: msgs });
  },
  toggleChat: () => set({ chatOpen: !get().chatOpen }),
  setAIThinking: (thinking) => set({ isAIThinking: thinking }),

  // ─── Group ─────────────────────────────────────────────────────────────
  addGroupUser: (name) => {
    const { groupUsers } = get();
    if (groupUsers.find((u) => u.name === name)) return;
    set({
      groupUsers: [...groupUsers, {
        name,
        color: generateColor(name),
        initials: getInitials(name),
      }],
    });
  },
  removeGroupUser: (name) =>
    set({ groupUsers: get().groupUsers.filter((u) => u.name !== name) }),
  setGroupUsers: (names) =>
    set({
      groupUsers: names.map((name) => ({
        name,
        color: generateColor(name),
        initials: getInitials(name),
      })),
    }),

  // ─── UI ────────────────────────────────────────────────────────────────
  setUpsell: (upsell) => set({ upsellSuggestion: upsell }),
  addToast: (message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setShowOrderConfirmation: (show) => set({ showOrderConfirmation: show }),
  setPreferences: (prefs) => set({ preferences: prefs }),
  mergePreferences: (prefs) => set({ preferences: { ...get().preferences, ...prefs } }),
}));
