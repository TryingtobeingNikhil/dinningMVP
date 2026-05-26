// Shared TypeScript types for the Smart Dining Assistant

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  tags: string[];
  allergens: string[];
  available: boolean;
  popular_score: number;
  calories?: number;
  complementary_items: string[];
  is_chef_special: boolean;
  is_combo_eligible: boolean;
}

export interface CartItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
  added_by: string;
  image_url?: string;
}

export interface AgentEvent {
  agent: string;
  status: "thinking" | "done" | "error";
  result?: string;
  ms?: number;
}

export interface Suggestion {
  itemId: string;
  name: string;
  price: number;
  reason: string;
  image_url?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: Suggestion[];
  agentEvents?: AgentEvent[];
  action?: string;
  actionData?: Record<string, unknown>;
  isLoading?: boolean;
}

export interface UpsellSuggestion {
  message: string;
  suggestion_item: MenuItem;
  trigger: string;
}

export interface OrderStatus {
  status: "confirmed" | "preparing" | "ready" | "delivered";
  label: string;
  time: string;
}

export interface Order {
  order_id: string;
  session_id: string;
  table_id: string;
  customer_name: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  estimated_wait_minutes: number;
  created_at: string;
}

export interface SessionUser {
  name: string;
  color: string;
  initials: string;
}

export type Language = "en" | "hi" | "te";
