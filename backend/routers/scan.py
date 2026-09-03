from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import ScanConfirmRequest, OrderOut
from services import order_service

router = APIRouter(tags=["scan"])


@router.post("/orders/{order_id}/confirm-scan", response_model=OrderOut, status_code=status.HTTP_200_OK)
def confirm_scan_endpoint(
    order_id: str,
    payload: ScanConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Rider scans the physical/digital QR code at customer drop-off.
    Validates the cryptographic qr_token against the order's capability signature,
    flips order status to 'delivered', and commits a permanent audit record into status_history.
    """
    return order_service.confirm_scan(
        db=db,
        order_id=order_id,
        qr_token=payload.qr_token,
        rider_id=payload.rider_id or "rider_on_duty"
    )
