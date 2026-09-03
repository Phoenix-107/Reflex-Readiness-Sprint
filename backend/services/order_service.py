import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import Order, OrderStatus, StatusHistory
from schemas import OrderCreate
from services.qr_service import generate_qr_token, verify_qr_token

# Strictly enforced status transition rules
LEGAL_TRANSITIONS = {
    OrderStatus.REQUESTED: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
    OrderStatus.ASSIGNED: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
    OrderStatus.PICKED_UP: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    OrderStatus.DELIVERED: [],
    OrderStatus.CANCELLED: [],
}


def create_order(db: Session, order_in: OrderCreate) -> Order:
    order_id = str(uuid.uuid4())
    qr_token = generate_qr_token(order_id)
    
    order = Order(
        id=order_id,
        retailer_id=order_in.retailer_id or "ret_northstar_01",
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        delivery_address=order_in.delivery_address,
        item_description=order_in.item_description,
        status=OrderStatus.REQUESTED,
        assigned_rider_id=None,
        qr_token=qr_token,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(order)
    
    # Audit log creation
    history_entry = StatusHistory(
        id=str(uuid.uuid4()),
        order_id=order_id,
        status=OrderStatus.REQUESTED.value,
        changed_by=order.retailer_id,
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)
    
    db.commit()
    db.refresh(order)
    return order


def get_orders(
    db: Session,
    status_filter: Optional[str] = None,
    assigned_rider_id: Optional[str] = None,
    retailer_id: Optional[str] = None
) -> List[Order]:
    query = db.query(Order)
    
    if status_filter:
        try:
            enum_val = OrderStatus(status_filter)
            query = query.filter(Order.status == enum_val)
        except ValueError:
            query = query.filter(Order.status == status_filter)
            
    if assigned_rider_id:
        if assigned_rider_id == "me":
            # For prototype rider view, returns assigned orders that are active
            query = query.filter(Order.assigned_rider_id.isnot(None))
        else:
            query = query.filter(Order.assigned_rider_id == assigned_rider_id)
            
    if retailer_id:
        query = query.filter(Order.retailer_id == retailer_id)
        
    return query.order_by(Order.created_at.desc()).all()


def get_order_by_id(db: Session, order_id: str) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def assign_rider(db: Session, order_id: str, rider_id: str, dispatcher_id: str = "dispatcher_central") -> Order:
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
        
    if order.status != OrderStatus.REQUESTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign order with current status '{order.status.value}'. Must be 'requested'."
        )
        
    order.assigned_rider_id = rider_id
    order.status = OrderStatus.ASSIGNED
    order.updated_at = datetime.utcnow()
    
    history_entry = StatusHistory(
        id=str(uuid.uuid4()),
        order_id=order.id,
        status=OrderStatus.ASSIGNED.value,
        changed_by=f"dispatcher ({dispatcher_id}) -> {rider_id}",
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)
    
    db.commit()
    db.refresh(order)
    return order


def update_status(db: Session, order_id: str, target_status: str, changed_by: str) -> Order:
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
        
    try:
        new_status_enum = OrderStatus(target_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{target_status}'"
        )
        
    allowed_next = LEGAL_TRANSITIONS.get(order.status, [])
    if new_status_enum not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Illegal state transition from '{order.status.value}' to '{new_status_enum.value}'. "
                f"Allowed transitions: {[s.value for s in allowed_next]}"
            )
        )
        
    # Delivering requires QR scan verification endpoint instead of standard PATCH
    if new_status_enum == OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Closing an order as 'delivered' requires QR scan confirmation via POST /orders/{id}/confirm-scan"
        )
        
    order.status = new_status_enum
    order.updated_at = datetime.utcnow()
    
    history_entry = StatusHistory(
        id=str(uuid.uuid4()),
        order_id=order.id,
        status=new_status_enum.value,
        changed_by=changed_by,
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)
    
    db.commit()
    db.refresh(order)
    return order


def confirm_scan(db: Session, order_id: str, qr_token: str, rider_id: str = "rider_assigned") -> Order:
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
        
    if order.status == OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has already been confirmed and marked delivered."
        )
        
    # State validation: Rider must have picked up or be assigned to the order
    if order.status not in [OrderStatus.PICKED_UP, OrderStatus.ASSIGNED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm delivery for order in '{order.status.value}' state. Must be 'picked_up'."
        )
        
    # Security check: Validate capability token via QR Service
    if not verify_qr_token(order_id, qr_token):
        # Direct token match check as fallback
        if order.qr_token != qr_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="QR Token validation failed: token does not match order capability key or has been tampered with."
            )
            
    order.status = OrderStatus.DELIVERED
    order.updated_at = datetime.utcnow()
    
    history_entry = StatusHistory(
        id=str(uuid.uuid4()),
        order_id=order.id,
        status=OrderStatus.DELIVERED.value,
        changed_by=f"rider ({rider_id}) [QR Scan Verified]",
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)
    
    db.commit()
    db.refresh(order)
    return order
