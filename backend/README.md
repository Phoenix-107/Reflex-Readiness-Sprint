# Northstar Reflex — Backend (FastAPI + SQLAlchemy)

## Setup & Running Instructions

### 1. Install Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/northstar`). Required.
- `QR_SECRET`: HMAC signing secret for QR tokens.

### 3. Start FastAPI Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
OpenAPI documentation will be available at `http://localhost:8000/docs`.

### 4. API Endpoints
- `POST /orders` — Retailer creates order (returns order + customer tracking token)
- `GET /orders` — Filter by `status=requested`, `assigned_rider_id=me`, `retailer_id=...`
- `PATCH /orders/{id}/assign` — Dispatcher assigns rider
- `PATCH /orders/{id}/status` — Rider advances status (`requested` → `assigned` → `picked_up`)
- `POST /orders/{id}/confirm-scan` — Rider scans QR code to verify token and mark `delivered`
- `GET /orders/{id}/track?token={token}` — Customer token-gated live tracking
- `GET /catalog` — Public product catalog
- `POST /catalog` — Add an item to the product catalog
