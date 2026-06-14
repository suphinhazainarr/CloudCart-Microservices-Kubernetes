# CloudCart

Production-grade e-commerce platform built with microservices.
React frontend · Node.js/Express backend · MongoDB · Redis · TypeScript

---

## Architecture
```
                                 Browser
                                    ↓
                 React Frontend (port 5173 — dev only)
                                    ↓
                         API Gateway (port 4000)  ← single entry point
                                    ↓
             ┌──────────────────────────────────────────────┐
             │  Auth Service         (port 4001)            │
             │  Product Service      (port 4002)            │
             │  Cart Service         (port 4003)            │
             │  Order Service        (port 4004)            │
             │  Payment Service      (port 4005)            │
             │  Notification Service (port 4006 — internal) │
             └──────────────────────────────────────────────┘
                                    ↓
                             MongoDB + Redis
```

---

## Prerequisites

- Node.js v20+
- pnpm v8+
- MongoDB (local or Atlas)
- Redis (local or Upstash)

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/yourname/cloudcart.git
cd cloudcart
pnpm install

# 2. Build shared package
pnpm --filter @cloudcart/shared build

# 3. Copy env files and fill in values
cp services/auth/.env.example        services/auth/.env
cp services/product/.env.example     services/product/.env
cp services/cart/.env.example        services/cart/.env
cp services/order/.env.example       services/order/.env
cp services/payment/.env.example     services/payment/.env
cp services/gateway/.env.example     services/gateway/.env
cp services/notification/.env.example services/notification/.env

# 4. Seed the database
pnpm seed

# 5. Start everything
pnpm dev
```

---

## Environment variables

All services share the same MongoDB URI and JWT secret.
Copy the tables below into each service's `.env` file.

### Required across all services

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Min 32-char secret for access tokens |

### Auth service (port 4001)

| Variable | Default | Description |
|---|---|---|
| `JWT_REFRESH_SECRET` | — | Min 32-char refresh token secret |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token expiry |
| `BCRYPT_ROUNDS` | `12` | bcrypt work factor |

### Product service (port 4002)

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `PRODUCT_CACHE_TTL` | `300` | Cache TTL in seconds |

### Cart service (port 4003)

| Variable | Default | Description |
|---|---|---|
| `PRODUCT_SERVICE_URL` | `http://localhost:4002` | Product service URL |
| `CART_TTL_AUTHENTICATED` | `604800` | 7 days in seconds |
| `CART_TTL_GUEST` | `86400` | 24 hours in seconds |

### Order service (port 4004)

| Variable | Default | Description |
|---|---|---|
| `CART_SERVICE_URL` | `http://localhost:4003` | Cart service URL |
| `PRODUCT_SERVICE_URL` | `http://localhost:4002` | Product service URL |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:4006` | Notification service URL |

### Payment service (port 4005)

| Variable | Default | Description |
|---|---|---|
| `ORDER_SERVICE_URL` | `http://localhost:4004` | Order service URL |
| `PAYMENT_SUCCESS_RATE` | `90` | % of payments that succeed (dev) |

### Gateway (port 4000)

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_MAX` | `100` | Requests per window per IP |
| `AUTH_RATE_LIMIT_MAX` | `10` | Auth attempts per window |

---

## Test accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@cloudcart.dev | Admin@123 |
| Customer | john@example.com | Customer@123 |

---

## API documentation

Each service exposes Swagger UI in development:

- Auth service: http://localhost:4001/api/auth/docs

---

## Scripts

```bash
pnpm dev               # Start all services + frontend + gateway concurrently
pnpm dev:gateway       # Gateway only
pnpm dev:auth          # Auth service only
pnpm dev:product       # Product service only
pnpm dev:cart          # Cart service only
pnpm dev:order         # Order service only
pnpm dev:payment       # Payment service only
pnpm dev:notification  # Notification service only
pnpm dev:web           # React frontend only
pnpm build:all         # Build everything
pnpm typecheck         # TypeScript check across repo
pnpm lint              # ESLint across repo
pnpm seed              # Seed database with sample data
```

---

## Tech stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Redux Toolkit · RTK Query · React Router · Framer Motion · Recharts · React Hook Form · Zod

**Backend:** Node.js · Express · TypeScript · Mongoose · ioredis · jsonwebtoken · bcryptjs · Zod · Swagger

**Database:** MongoDB · Redis

**Architecture:** Microservices · REST API · JWT auth · RBAC · Cache-aside pattern
