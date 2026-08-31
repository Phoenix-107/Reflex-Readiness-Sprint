# Northstar Reflex

A lightweight delivery-tracking prototype. Every delivery becomes a trackable object the moment it's created, and four perspectives interact with that same object instead of talking to each other by phone: an anonymous **visitor**, a **retailer**, a **dispatcher**, and a **rider**. Proof of delivery is a QR-code scan tied to the order's ID, not a verbal confirmation.

Generated in Google AI Studio. This repo contains **two implementations of the same API contract**:

1. **The app that actually runs** (`npm run dev`) — a Vite + React + TypeScript frontend served by a single Express server (`server.ts`) that also implements the whole API in-memory. This is what AI Studio builds and previews.
2. **A standalone FastAPI + PostgreSQL backend** (`backend/`) — a persistent, production-shaped reference implementation of the identical endpoints, for when you outgrow the in-memory prototype.

They are not wired together. Pick one depending on what you need — see [Which backend do I run?](#which-backend-do-i-run) below.

---

## Table of Contents

- [Which backend do I run?](#which-backend-do-i-run)
- [Quick Start (AI Studio app)](#quick-start-ai-studio-app)
- [Quick Start (FastAPI backend)](#quick-start-fastapi-backend)
- [User Flow](#user-flow)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Trade-offs](#trade-offs)
- [Non-Goals](#non-goals)

---

## Which backend do I run?

| | **`npm run dev`** (Express, in-memory) | **`backend/`** (FastAPI, Postgres/SQLite) |
|---|---|---|
| Use for | Previewing/demoing in AI Studio, quick local runs | Persistent data, a real deployment target |
| Data survives restart? | No — reseeds every boot | Yes — stored in Postgres or SQLite |
| Requires | Node.js only | Python 3.10+, and Postgres or falls back to SQLite |
| Frontend talks to it? | Yes, out of the box | Not by default — you'd point `API_BASE` in `src/api/ordersClient.ts` at it |

If you just cloned this from AI Studio and want to see it working: use **Quick Start (AI Studio app)**. If you're taking this toward production: use the FastAPI backend and repoint the frontend at it.

## Quick Start (AI Studio app)

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

This starts the Express server on port `3000`, which serves the Vite dev build and the API together (routes are registered at both `/api/*` and bare `/*`). Demo data — 4 catalog items and 4 sample orders across every status — is seeded into memory automatically on boot. Hit the "Reseed Demo" button in the header (or `POST /api/reset-demo`) any time to reset it.

No `.env` setup is required to run the app locally. `.env.example` documents `GEMINI_API_KEY` and `APP_URL`, which AI Studio injects automatically when hosted there; they aren't needed for the delivery-tracking flow itself.

## Quick Start (FastAPI backend)

**Prerequisites:** Python 3.10+, PostgreSQL (optional — falls back to SQLite)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional — defaults to sqlite:///./northstar_reflex.db if unset
export DATABASE_URL="postgresql://user:password@localhost:5432/northstar"
export QR_SECRET_KEY="your-hmac-signing-secret"

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Demo data seeds automatically on startup (skipped if orders already exist). Interactive API docs are at `http://localhost:8000/docs`.

## User Flow

1. **Anonymous visitor** lands on the storefront (`/`) and browses the catalog — no login required.
2. Visitor places an order → submits name, phone, address, and item via the retailer-facing order form.
3. The order is created with `requested` status, a UUID, and a signed `qr_token`. The response includes a **customer tracking URL** (`/track/{id}?token=...`) built from that same token — no separate customer account is created.
4. **Dispatcher** (`/dispatcher`) sees the queue of `requested` orders and assigns each to a rider.
5. **Rider** (`/rider`) sees only their assigned orders and advances them: `assigned → picked_up`.
6. Rider scans the order's QR code on drop-off → `POST /orders/{id}/confirm-scan` validates the `qr_token` and flips status to `delivered`, appending to the audit trail. Status can **not** be pushed to `delivered` through the plain status-update endpoint — only through a verified scan.
7. The customer can revisit their tracking link (`/track/{id}?token=...`) at any time to see live status and full history, without logging in.

## Data Model

**Order**

| Field | Type |
|---|---|
| id | string (UUID-style, e.g. `ord-req-001-88f2`) |
| retailer_id | string, defaults to `ret_northstar_01` |
| customer_name, customer_phone, delivery_address | string |
| item_description | string |
| status | enum: `requested` \| `assigned` \| `picked_up` \| `delivered` \| `cancelled` |
| assigned_rider_id | string, nullable until dispatcher assigns |
| qr_token | HMAC-signed capability token (format `ntk_<nonce>_<signature>`) — doubles as the QR payload and the customer's tracking credential |
| created_at, updated_at | timestamps |
| status_history | list of `StatusHistory` entries |

**StatusHistory** (append-only audit trail)

| Field | Type |
|---|---|
| id | string |
| order_id | FK |
| status | string |
| changed_by | string — e.g. `dispatcher (dispatcher_hq) -> rider_alex_01`, or `rider (rider_alex_01) [QR Scan Verified]` |
| timestamp | datetime |

This table, not just the `status` column, is what answers "who changed this, and when."

**CatalogItem** (public, read-only)

| Field | Type |
|---|---|
| id, name, description, category, price, image_url, estimated_prep_minutes | string |

## API Reference

Both implementations expose the same contract. On the Express server, every route below is also available under an `/api` prefix (e.g. `/api/orders`) for compatibility.

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/catalog` | Public product listing | None |
| POST | `/orders` | Creates an order; response includes `customer_tracking_token` and `tracking_url` | None to create; token issued on response |
| GET | `/orders` | List/filter by `status`, `assigned_rider_id` (`me` supported), `retailer_id` | None (prototype) |
| GET | `/orders/{id}` | Fetch a single order | None (prototype) |
| PATCH | `/orders/{id}/assign` | Dispatcher assigns a rider (only valid from `requested`) | None (prototype) |
| PATCH | `/orders/{id}/status` | Advance status one legal step at a time; rejects jumping to `delivered` | None (prototype) |
| POST | `/orders/{id}/confirm-scan` | Validates `qr_token`, flips status to `delivered`, writes audit entry | `qr_token` in body |
| GET | `/orders/{id}/track?token=xyz` | Customer's read-only view of their own order | `qr_token` as query param |
| POST | `/reset-demo` | Express server only — reseeds in-memory data | None |

Legal status transitions, enforced server-side:

```
requested  → assigned | cancelled
assigned   → picked_up | cancelled
picked_up  → delivered | cancelled     (delivered ONLY via confirm-scan)
delivered  → (terminal)
cancelled  → (terminal)
```

## Project Structure

```
northstar-reflex/
├── server.ts                     # Express server: serves Vite frontend + full in-memory API (npm run dev entry point)
├── index.html / vite.config.ts   # Vite frontend config
├── src/
│   ├── App.tsx                   # Route switch: "/" storefront, /retailer, /dispatcher, /rider, /track/{id}
│   ├── types.ts
│   ├── api/
│   │   └── ordersClient.ts       # fetch wrapper + polling hooks (useOrdersPolling, useTrackOrderPolling)
│   ├── components/
│   │   ├── AuditTrailModal.tsx
│   │   └── StatusBadge.tsx
│   └── views/
│       ├── LandingView.tsx       # public catalog, no auth
│       ├── RetailerView.tsx      # order creation form
│       ├── DispatcherView.tsx    # unassigned queue + rider assignment
│       ├── RiderView.tsx         # rider's assigned orders + QR scan
│       └── TrackOrderView.tsx    # token-gated customer tracking page
│
└── backend/                      # standalone FastAPI reference implementation
    ├── main.py                   # FastAPI app instance, router mounts, auto-seed on startup
    ├── database.py                # SQLAlchemy engine/session (Postgres or SQLite fallback)
    ├── models.py                  # Order, StatusHistory, CatalogItem ORM models
    ├── schemas.py                 # Pydantic request/response schemas
    ├── routers/
    │   ├── orders.py              # orders CRUD, assign, status, track, catalog
    │   └── scan.py                 # confirm-scan
    ├── services/
    │   ├── order_service.py       # status transition rules, validation
    │   └── qr_service.py           # HMAC token generation + verification
    ├── seed.py                    # demo data: 1 retailer, 2 riders, 4 orders, 4 catalog items
    └── README.md                  # backend-specific setup notes
```

## Trade-offs

**1. Capability-token access instead of full role-based authentication.**
There are no user accounts or sessions anywhere in the system. Retailer, dispatcher, and rider views are open in this prototype; the one real access boundary is the customer's `qr_token`, which is required to view `/track/{id}`. This is intentional — see [Non-Goals](#non-goals) — and mirrors how production link-sharing systems scope access without full RBAC.

**2. Polling instead of real push (WebSockets / Postgres LISTEN-NOTIFY).**
`useOrdersPolling` and `useTrackOrderPolling` refresh every 5–10 seconds. This is imperceptible to a dispatcher or a customer checking a delivery, and it's trivial to build and demo reliably. Swapping in WebSockets later is an internal change behind the same `GET /orders` contract.

**3. QR-scan confirmation is real but stripped-down.**
No offline mode, no photo evidence, no failure-recovery flow for a damaged code or an uncooperative customer. The scan mechanism is real cryptographic verification (HMAC-SHA256 signed tokens, `hmac.compare_digest` / `crypto.timingSafeEqual` for constant-time comparison) — but edge cases around connectivity and disputes aren't handled.

**4. Anonymous browsing, identity captured only at order submission.**
The storefront (`LandingView`) requires nothing from a visitor. The only point a customer's identity enters the system is the order form itself (name + phone), and the only "credential" issued afterward is the `qr_token` embedded in their tracking link — not a login.

**5. Two backends, not one.**
The Express in-memory server exists because that's what AI Studio's runtime spins up for instant previewing. The FastAPI backend exists because the original architecture called for a real database and a routers/services split for a production path. Keeping both means the demo works out of the box while a persistence-ready implementation is sitting right next to it, matching the same contract.

## Non-Goals

Explicitly out of scope for this prototype:

- Full authentication/RBAC system, customer accounts, or password/email login
- WebSockets or Postgres LISTEN/NOTIFY push infrastructure
- Offline mode or QR scan failure-recovery flows
- Photo evidence of delivery
- Persisting data in the Express/in-memory server across restarts (use the FastAPI backend for that)