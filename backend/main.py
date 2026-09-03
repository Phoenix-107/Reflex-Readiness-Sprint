import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import orders, scan
# seed import removed

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Northstar Reflex API",
    description="Lightweight delivery-tracking prototype with capability tokens and QR proof-of-delivery",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount domain routers
app.include_router(orders.router)
app.include_router(scan.router)


# startup seeding removed


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "northstar-reflex-fastapi"}
