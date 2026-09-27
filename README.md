# StockSense — Inventory Management System

> **Live-updating, multi-tenant Inventory Management.** Replace spreadsheets with real CRUD, atomic stock mutations, low-stock alerts, and a role-based team.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v3, TanStack Query v5, Zustand, React Router v6, React Hook Form + Zod |
| **Backend** | Node.js 20, Express 4, Mongoose 8, MongoDB Atlas |
| **Auth** | JWT (15 m access + 7 d refresh, httpOnly cookie), bcrypt, OTP email verification |
| **Storage** | Local disk (dev) → Cloudinary (prod) for product images |
| **Deploy** | Render (backend) + Vercel (frontend) |

---

## Repository Structure

```
stockSense/
├── backend/                  Express API
│   ├── src/
│   │   ├── config/           env, db, logger, mailer, storage
│   │   ├── controllers/      request handlers
│   │   ├── middlewares/      auth, tenantScope, rbac, validate, upload
│   │   ├── models/           Mongoose schemas
│   │   ├── repositories/     BaseRepository + per-model repos
│   │   ├── routes/           Express routers
│   │   ├── services/         business logic
│   │   ├── utils/            ApiError, ApiResponse, pagination
│   │   └── validators/       Zod schemas
│   ├── tests/
│   │   ├── unit/             schema indexes, stock mutation, dashboard, user management
│   │   └── integration/      health endpoint (auth integration excluded from npm test)
│   ├── .env.example
│   └── package.json
├── frontend/                 Vite + React SPA
│   ├── src/
│   │   ├── api/              Axios clients per domain
│   │   ├── components/       Reusable UI (auth, dashboard, inventory, stock)
│   │   ├── hooks/            TanStack Query hooks (30 s polling)
│   │   ├── lib/              Axios instance (auto-refresh interceptor)
│   │   ├── pages/            Route-level pages
│   │   ├── store/            Zustand auth store
│   │   └── tests/            Vitest + Testing Library
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── render.yaml               Render Blueprint (one-click backend deploy)
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 20+
- A [MongoDB Atlas](https://cloud.mongodb.com/) cluster (free M0 is fine)

### 1. Clone & install

```bash
git clone https://github.com/lord-TJAI/stockSense.git
cd stockSense
```

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI at minimum
npm install
npm run dev        # http://localhost:5000
```

```bash
# Frontend (new terminal)
cd frontend
cp .env.example .env.local
# VITE_API_URL defaults to http://localhost:5000 — no change needed
npm install
npm run dev        # http://localhost:5173
```

### 2. Run tests

```bash
# Backend (unit + health integration — no Atlas needed)
cd backend && npm test

# Backend integration (needs Atlas DNS — run on a network that can reach Atlas)
cd backend && npm run test:integration

# Frontend
cd frontend && npm test
```

---

## Deployment

> **Deploy order matters:** backend first (to get its URL), then frontend (pointing at that URL), then update backend CORS.

### Step 1 — MongoDB Atlas (already done)

Your cluster is at `mongodb+srv://jaibharath0410_db_user:...@cluster0.lbzufoj.mongodb.net/`.  
The app connects to database `stocksense` (set via Mongoose `dbName` option — ignores the URI segment).

**Required Atlas config:**

- **IP Allowlist →** add `0.0.0.0/0` (allow all) for Render's dynamic IPs
- **Database user** has `readWrite` on `stocksense`

### Step 2 — Deploy Backend to Render

1. Go to [render.com](https://render.com) → **New → Blueprint**
2. Connect your GitHub repo (`lord-TJAI/stockSense`)
3. Render reads `render.yaml` automatically and creates the `stocksense-api` web service
4. In the service's **Environment** tab, set:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | `mongodb+srv://jaibharath0410_db_user:w236WJUVpeWRpmB@cluster0.lbzufoj.mongodb.net/stocksense?appName=Cluster0` |
   | `CLIENT_URLS` | `http://localhost:5173` ← temporary, update after Step 3 |
   | `EMAIL_PROVIDER` | `smtp` (or keep `mock` for now) |

5. Click **Deploy** — wait for the health check at `/api/health` to return 200
6. Note your Render URL: `https://stocksense-api.onrender.com` (or similar)

### Step 3 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. Select `lord-TJAI/stockSense`, set **Root Directory** to `frontend`
3. Framework preset: **Vite** (auto-detected via `vercel.json`)
4. Under **Environment Variables**, add:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://stocksense-api.onrender.com` |

5. Deploy — note your Vercel URL: `https://stocksense.vercel.app` (or similar)

### Step 4 — Update Backend CORS

1. In Render dashboard → **Environment** → update `CLIENT_URLS`:
   ```
   https://stocksense.vercel.app
   ```
   *(comma-separate multiple if needed, e.g. staging + production)*
2. Click **Save** → Render auto-redeploys

### Step 5 — Verify end-to-end

```bash
# Health check
curl https://stocksense-api.onrender.com/api/health

# Expected:
# {"success":true,"data":{"status":"ok","environment":"production",...}}
```

Open `https://stocksense.vercel.app` → sign up → create a product → record a receipt → confirm stock level updates.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | 64-byte random hex — generate with `crypto.randomBytes(64).toString('hex')` |
| `JWT_REFRESH_SECRET` | ✅ | Different 64-byte random hex |
| `CLIENT_URLS` | ✅ | Comma-separated allowed frontend origins |
| `JWT_ACCESS_EXPIRY` | — | Default `15m` |
| `JWT_REFRESH_EXPIRY` | — | Default `7d` |
| `EMAIL_PROVIDER` | — | `mock` (console log) or `smtp` |
| `EMAIL_HOST/USER/PASS/FROM` | — | SMTP credentials (only if `EMAIL_PROVIDER=smtp`) |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | — | Leave blank to use local-disk image storage |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Full backend URL — no trailing slash |

---

## API Overview

| Domain | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | signup, login, OTP, refresh, invite accept |
| Users | `/api/users` | profile, password, team management, invites |
| Inventory | `/api/warehouses`, `/api/locations`, `/api/categories`, `/api/products` | full CRUD, soft-delete |
| Stock mutations | `/api/receipts`, `/api/deliveries`, `/api/transfers`, `/api/adjustments` | atomic, ledger-backed |
| Dashboard | `/api/dashboard` | KPI summary (parallel aggregation) |
| Alerts | `/api/alerts/low-stock`, `/api/alerts/out-of-stock` | polling-based |
| Stock | `/api/stock/levels`, `/api/stock/history/:productId`, `/api/stock/snapshot/:productId` | |
| Health | `/api/health` | returns `{status:"ok", uptime, environment}` |

---

## Architecture Decisions

### Tenant isolation
`BaseRepository._scope(filter)` injects `organizationId` as the **last key** in every query filter — it always overwrites caller-supplied values. Any repository method that skips `_scope` throws `[TenantScope] organizationId is required`. The `StockLevel` compound unique index `(organizationId, productId, locationId)` enforces isolation at the database layer, not just application logic.

### Atomic stock mutations

| Operation | Guard |
|---|---|
| Receipt | `$inc` + `upsert:true` — quantity only increases |
| Delivery | `{quantity:{$gte:qty}}` in the update filter — stock never goes negative |
| Transfer | Mongoose session wraps debit + credit — crash-safe, falls back gracefully on standalone |
| Adjustment | `$set` to exact value — negative check fires before any DB call |

### Polling, not WebSockets
MVP uses `refetchInterval` on TanStack Query (products: 30 s, alerts: 60 s, dashboard KPIs: 30 s). True push-based real-time (socket.io) is deferred to a future phase.

### Auth token storage
- **Access token:** `sessionStorage` (cleared on tab close, never persisted)
- **Refresh token:** `httpOnly` cookie (inaccessible to JS, survives tab close)
- **Zustand auth store:** persists user metadata to `localStorage` (no tokens)

---

## Phases Completed

| Phase | Branch | Description |
|---|---|---|
| 0 | `phase/0-scaffolding` | Express + Vite skeleton, health route, BaseRepository |
| 1 | `phase/1-auth-and-orgs` | Auth, RBAC, Organizations, Invites, JWT, OTP |
| 2 | `phase/2-core-data-models` | Warehouses, Locations, Categories, Products, StockLevel |
| 3 | `phase/3-stock-mutations` | Receipts, Deliveries, Transfers, Adjustments, StockLedger |
| 4 | `phase/4-dashboard-kpis` | Dashboard KPIs, low-stock & out-of-stock alerts |
| 5 | `phase/5-user-management` | Team management, invite CRUD, Settings (profile, password, org) |
| 6 | `phase/6-deployment` | render.yaml, vercel.json, .env.example files, this README |
