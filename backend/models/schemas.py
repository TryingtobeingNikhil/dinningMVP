from pydantic import BaseModel, Field
from typing import Optional, List, Any
from enum import Enum


class IntentType(str, Enum):
    GREET = "GREET"
    RECOMMEND = "RECOMMEND"
    ADD_ITEM = "ADD_ITEM"
    REMOVE_ITEM = "REMOVE_ITEM"
    UPSELL_CHECK = "UPSELL_CHECK"
    CHECKOUT = "CHECKOUT"
    GROUP_INFO = "GROUP_INFO"
    POPULAR = "POPULAR"
    MULTILANG = "MULTILANG"
    FALLBACK = "FALLBACK"


class MenuItem(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: str
    image_url: str
    tags: List[str]
    allergens: List[str]
    available: bool
    popular_score: float
    calories: Optional[int] = None
    complementary_items: List[str] = []
    is_chef_special: bool = False
    is_combo_eligible: bool = False


class CartItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int
    special_instructions: Optional[str] = ""
    added_by: str = "You"
    image_url: Optional[str] = ""


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    table_id: str
    user_name: Optional[str] = "Guest"
    cart: Optional[List[CartItem]] = []
    preferences: Optional[dict] = {}
    language: Optional[str] = "en"


class AgentEvent(BaseModel):
    agent: str
    status: str  # "thinking" | "done" | "error"
    result: Optional[Any] = None
    ms: Optional[int] = None


class Suggestion(BaseModel):
    item_id: str
    name: str
    price: float
    reason: str
    image_url: Optional[str] = ""


class ChatResponse(BaseModel):
    message: str
    suggestions: Optional[List[Suggestion]] = []
    action: Optional[str] = None  # "add_to_cart" | "show_menu" | "checkout"
    action_data: Optional[Any] = None
    agent_events: Optional[List[AgentEvent]] = []
    language_detected: Optional[str] = "en"


class OTPRequest(BaseModel):
    phone: str
    session_id: str


class OTPVerify(BaseModel):
    phone: str
    otp: str
    session_id: str
    customer_name: str


class OrderRequest(BaseModel):
    session_id: str
    table_id: str
    customer_name: str
    customer_phone: str
    cart: List[CartItem]


class WSMessage(BaseModel):
    event: str  # "cart:item_added" | "cart:item_removed" | "session:user_joined" | "order:placed"
    data: Any
    table_id: str
