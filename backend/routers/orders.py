from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import OrderCreate, OrderOut, OrderAssign, OrderStatusUpdate, OrderCreateResponse, TrackOrderOut, CatalogItemOut, CatalogItemCreate
from models import CatalogItem
from services import order_service

router = APIRouter(tags=["orders"])


@router.post("/orders", response_model=OrderCreateResponse, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(order_in: OrderCreate, db: Session = Depends(get_db)):
    order = order_service.create_order(db, order_in)
    return OrderCreateResponse(
        order=order,
        customer_tracking_token=order.qr_token,
        tracking_url=f"/track/{order.id}?token={order.qr_token}"
    )


@router.get("/orders", response_model=List[OrderOut])
def list_orders_endpoint(
    status: Optional[str] = Query(None, description="Filter by status (e.g. requested, assigned, picked_up, delivered)"),
    assigned_rider_id: Optional[str] = Query(None, description="Filter by rider ID or 'me'"),
    retailer_id: Optional[str] = Query(None, description="Filter by retailer ID"),
    db: Session = Depends(get_db)
):
    return order_service.get_orders(
        db=db,
        status_filter=status,
        assigned_rider_id=assigned_rider_id,
        retailer_id=retailer_id
    )


@router.patch("/orders/{order_id}/assign", response_model=OrderOut)
def assign_order_endpoint(
    order_id: str,
    payload: OrderAssign,
    db: Session = Depends(get_db)
):
    return order_service.assign_rider(
        db=db,
        order_id=order_id,
        rider_id=payload.rider_id,
        dispatcher_id="dispatcher_hq"
    )


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status_endpoint(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    return order_service.update_status(
        db=db,
        order_id=order_id,
        target_status=payload.status,
        changed_by=payload.changed_by or "rider"
    )


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order_endpoint(order_id: str, db: Session = Depends(get_db)):
    order = order_service.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/orders/{order_id}/track", response_model=TrackOrderOut)
def track_order_endpoint(
    order_id: str,
    token: str = Query(..., description="Customer tracking capability token"),
    db: Session = Depends(get_db)
):
    order = order_service.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.qr_token != token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid tracking token for this order"
        )
        
    return order


@router.get("/catalog", response_model=List[CatalogItemOut])
def get_catalog_endpoint(db: Session = Depends(get_db)):
    items = db.query(CatalogItem).all()
    return items


@router.post("/catalog", response_model=CatalogItemOut, status_code=status.HTTP_201_CREATED)
def create_catalog_item_endpoint(item_in: CatalogItemCreate, db: Session = Depends(get_db)):
    item = CatalogItem(
        name=item_in.name,
        description=item_in.description,
        category=item_in.category,
        price=item_in.price,
        image_url=item_in.image_url or "",
        estimated_prep_minutes=item_in.estimated_prep_minutes or "15-20 min",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

