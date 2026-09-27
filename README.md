# StockSense — Inventory Management System

> **Status:** Phase 0 complete — scaffolding.

StockSense is a modern, **multi-tenant SaaS Inventory Management System** that replaces spreadsheets and manual registers for small-to-mid size businesses. It provides live-updating (polling-based) stock visibility across multiple warehouses.

---

## Architecture

```
        ┌───────────────┐
        │    Vercel     │
        │ React + Vite  │
        └───────┬───────┘
                │ HTTPS
                ▼
        ┌───────────────┐
        │    Render     │
        │ Express API   │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ MongoDB Atlas │
        └───────────────┘
```

**Backend:** Node.js 20 + Express 4 + Mongoose 8 + MongoDB Atlas  
**Frontend:** React 18 + Vite 5 + TailwindCSS + shadcn/ui + TanStack Query v5 + React Router 6

### Backend Layers
```
HTTP → Controller (thin) → Validator (Zod) → Service/Use Case
     → Repository (tenant-scoped) → MongoDB
```

---

## Local Development

### Prerequisites
- Node.js 20 LTS
- A MongoDB Atlas cluster (URI in `.env`)

### Backend
```bash
cd backend
cp .env.example .env    # fill in MONGODB_URI and secrets
npm install
npm run dev             # starts on port 5000
```

### Frontend
```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:5000
npm install
npm run dev             # starts on port 5173
```

### Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Dev Seeding (local dev only)
```bash
cd backend && npm run seed
```
> ⚠️ **This is a local developer tool only.** Never run against a production database. Demo data for a live org is loaded through the UI ("Load demo data" button).

---

## Environment Variable Registry

| Variable | Required | Default | Consumed by | Description |
|---|---|---|---|---|
| `PORT` | No | `5000` | backend | HTTP port |
| `MONGODB_URI` | **Yes in prod** | — | backend | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | **Yes** | dev fallback | backend | Secret for signing access tokens (use 64+ char random string) |
| `JWT_ACCESS_EXPIRY` | No | `15m` | backend | Access token lifetime |
| `JWT_REFRESH_SECRET` | **Yes** | dev fallback | backend | Secret for signing refresh tokens |
| `JWT_REFRESH_EXPIRY` | No | `7d` | backend | Refresh token lifetime |
| `EMAIL_PROVIDER` | No | `mock` | backend | `resend` \| `gmail` \| `mock` — `mock` logs to console |
| `EMAIL_HOST` | Only if provider ≠ mock | — | backend | SMTP host |
| `EMAIL_USER` | Only if provider ≠ mock | — | backend | SMTP username |
| `EMAIL_PASS` | Only if provider ≠ mock | — | backend | SMTP password |
| `CLOUDINARY_CLOUD_NAME` | No | — | backend | Cloudinary cloud name (falls back to local disk) |
| `CLOUDINARY_API_KEY` | No | — | backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | — | backend | Cloudinary API secret |
| `CLIENT_URLS` | **Yes in prod** | `http://localhost:5173` | backend | Comma-separated allowed CORS origins |
| `NODE_ENV` | **Yes** | `development` | backend | `production` \| `development` |
| `VITE_API_URL` | **Yes** | `http://localhost:5000` | frontend | Base URL of the Express API |

---

## Deployment

Deploy in this exact order (see Section 13 of the spec for rationale):

1. **Deploy backend to Render** with `CLIENT_URLS=http://localhost:5173` initially.
2. **Deploy frontend to Vercel** with `VITE_API_URL` pointing at the Render URL.
3. **Update `CLIENT_URLS` on Render** to the Vercel production URL. Never use a wildcard origin (`*`) in production.

---

## Git Conventions

- **Branches:** `phase/N-short-name` (e.g. `phase/4-receipts`)
- **Commits:** Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`

---

## Roadmap

### MVP (in progress)
- [x] Phase 0 — Scaffolding
- [ ] Phase 1 — Organizations, Auth & Invites
- [ ] Phase 2 — Core Data Models (Warehouses, Products, Categories)
- [ ] Phase 3 — Dashboard & Onboarding
- [ ] Phase 4 — Receipts
- [ ] Phase 5 — Delivery Orders
- [ ] Phase 6 — Internal Transfers & Stock Adjustments
- [ ] Phase 7 — Move History, Notifications, Low-stock Alerts, Audit Log
- [ ] Phase 8 — Team Management, Profile, Polish
- [ ] Phase 9 — Final Hardening & Deployment

### Post-MVP (not building now)
- **Push-based real-time sync** via WebSockets / socket.io (currently polling-based via TanStack Query `refetchInterval`)
- Redis caching layer
- Background job queue (BullMQ / similar)
- Database-level backup & recovery strategy
- API versioning (`/api/v2/...`)
- Deeper observability / APM integration
- Object storage migration (if Cloudinary → S3 needed at scale)
