from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class StatusHistorySchema(BaseModel):
    id: str
    order_id: str
    status: str
    changed_by: str
    timestamp: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, example="Jordan Rivera")
    customer_phone: str = Field(..., min_length=5, example="+1 (555) 321-9876")
    delivery_address: str = Field(..., min_length=5, example="742 Evergreen Terrace, Sector 4")
    item_description: str = Field(..., min_length=2, example="Specialty Espresso Beans & Cold Brew Kit")
    retailer_id: Optional[str] = Field("ret_northstar_01", example="ret_northstar_01")


class OrderAssign(BaseModel):
    rider_id: str = Field(..., min_length=2, example="rider_alex_01")


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., example="picked_up")
    changed_by: Optional[str] = Field("rider_me", example="rider_alex_01")


class ScanConfirmRequest(BaseModel):
    qr_token: str = Field(..., example="ntk_9a8b7c6d5e4f3a2b")
    rider_id: Optional[str] = Field("rider_me", example="rider_alex_01")


class OrderOut(BaseModel):
    id: str
    retailer_id: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    item_description: str
    status: str
    assigned_rider_id: Optional[str] = None
    qr_token: str
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistorySchema] = []

    class Config:
        orm_mode = True
        from_attributes = True


class OrderCreateResponse(BaseModel):
    order: OrderOut
    customer_tracking_token: str
    tracking_url: str


class TrackOrderOut(BaseModel):
    id: str
    customer_name: str
    delivery_address: str
    item_description: str
    status: str
    assigned_rider_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistorySchema] = []


class CatalogItemCreate(BaseModel):
    name: str = Field(..., min_length=1, example="House Espresso Roast")
    description: str = Field(..., min_length=1, example="Whole bean, light-medium roast with citrus notes")
    category: str = Field(..., min_length=1, example="Coffee Beans")
    price: str = Field(..., min_length=1, example="$18.50")
    image_url: Optional[str] = Field(None, example="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd")
    estimated_prep_minutes: Optional[str] = Field("15-20 min", example="15-20 min")


class CatalogItemOut(BaseModel):
    id: str
    name: str
    description: str
    category: str
    price: str
    image_url: Optional[str] = None
    estimated_prep_minutes: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True
