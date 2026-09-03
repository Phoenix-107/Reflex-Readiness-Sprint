import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class OrderStatus(str, enum.Enum):
    REQUESTED = "requested"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    retailer_id = Column(String(64), nullable=False, default="ret_northstar_01")
    customer_name = Column(String(128), nullable=False)
    customer_phone = Column(String(32), nullable=False)
    delivery_address = Column(String(256), nullable=False)
    item_description = Column(Text, nullable=False)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.REQUESTED)
    assigned_rider_id = Column(String(64), nullable=True)
    qr_token = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Append-only audit trail relation
    status_history = relationship(
        "StatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="StatusHistory.timestamp.asc()"
    )


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    changed_by = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="status_history")


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False)
    price = Column(String(32), nullable=False)
    image_url = Column(String(256), nullable=True)
    estimated_prep_minutes = Column(String(16), default="15-20 min")
