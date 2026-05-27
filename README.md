# Real-Time Order & Delivery Tracker

Full-stack monorepo (TurboRepo) built as a technical interview project for Televisa.  
Tracks delivery orders in real time using REST + WebSockets, with a React Native mobile app backed by a NestJS API.

---

## What's Inside

```
ti-imagine-apps/
├── apps/
│   ├── delivery-app/      # React Native (Expo SDK 54) — mobile client
│   └── delivery-backend/  # NestJS 11 — REST API + Socket.IO Gateway
│
├── infra/
│   ├── ci-cd.yml              # GitHub Actions pipeline (test → ECR → ECS Fargate)
│   ├── scaling-architecture.md# Redis WS adapter, Kafka, gRPC — scale-out design
│   └── mongo-init.js          # MongoDB init script (creates delivery_user)
│
├── docker-compose.yml     # Full local stack: MongoDB + Redis + NestJS
├── .env.example           # Compose-level env vars
└── turbo.json             # TurboRepo pipeline config
```

---

## Quick Start — Full Stack (Docker)

> **Requires:** Docker Desktop ≥ 4.x

```bash
# 1. Clone
git clone <repo-url>
cd ti-imagine-apps

# 2. Copy and configure env (backend .env drives both app and Docker Compose)
cp apps/delivery-backend/.env.example apps/delivery-backend/.env
# Edit apps/delivery-backend/.env if needed (ports, passwords)

# 3. Start all services (--env-file loads compose vars from the backend .env)
docker compose --env-file apps/delivery-backend/.env up -d

# Services available at:
#   MongoDB   → localhost:27017
#   Redis     → localhost:6379
#   Backend   → http://localhost:3001
```

Then start the mobile app:

```bash
cd apps/delivery-app
cp .env.example .env          # set EXPO_PUBLIC_API_URL=http://localhost:3001
npm install
npx expo start
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Native App                       │
│              (Expo SDK 54 / expo-router)                  │
│                                                          │
│   REST (Axios)    ─────────────────────────────────┐    │
│   WebSocket (Socket.IO) ───────────────────────────┤    │
└────────────────────────────────────────────────────┼────┘
                                                     ▼
                                          ┌─────────────────┐
                                          │  NestJS Backend  │
                                          │  Port 3001       │
                                          │                  │
                                          │  REST API        │
                                          │  /api/orders     │
                                          │                  │
                                          │  Socket.IO GW    │
                                          │  /orders (ns)    │
                                          └────────┬────────┘
                                                   │
                                  ┌────────────────┴────────────────┐
                                  │                                  │
                         ┌────────▼────────┐              ┌─────────▼────────┐
                         │   MongoDB 7     │              │   Redis 7        │
                         │   delivery_db   │              │   (cache / WS)   │
                         └─────────────────┘              └──────────────────┘
```

### Real-Time Flow

1. Mobile app calls `POST /api/orders` → NestJS saves to MongoDB → emits `order:created` via Socket.IO
2. All connected clients receive the event and update their list in real time
3. `PATCH /api/orders/:id/status` emits `order:status_updated` — the Order Detail screen updates live

---

## Apps

### `apps/delivery-app` — Mobile Client

React Native app with three screens: Dashboard (order list + live updates), Create Order (modal form), and Order Detail (SVG map + timeline).

→ See [`apps/delivery-app/README.md`](apps/delivery-app/README.md) for full documentation.

**Key dependencies:** Expo 54, expo-router, Axios, socket.io-client, react-native-svg

### `apps/delivery-backend` — API Server

NestJS REST API with a Socket.IO WebSocket Gateway. All order CRUD operations plus real-time event emission.

→ See [`apps/delivery-backend/README.md`](apps/delivery-backend/README.md) for full documentation.

**Key dependencies:** NestJS 11, Mongoose, Socket.IO, class-validator, ConfigModule

---

## REST API Reference

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders` | Create a new order |
| `GET` | `/orders` | List all orders |
| `GET` | `/orders/:id` | Get order by ID |
| `PATCH` | `/orders/:id/status` | Update order status |

### Order Status Values
`pending` → `in_transit` → `delivered`

---

## Environment Variables

There is no root `.env`. Each app owns its own environment file.

### Backend (`apps/delivery-backend/.env`)
Also read by `docker-compose.yml` for infrastructure bootstrapping (MongoDB, Redis, exposed ports).  
See [`apps/delivery-backend/.env.example`](apps/delivery-backend/.env.example).

Key vars:

```env
# App
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://delivery_user:delivery_pass@localhost:27017/delivery_db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispass

# Docker Compose infra (also used here)
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=secret
MONGO_DB=delivery_db
MONGO_PORT=27017
BACKEND_PORT=3001
```

### Mobile App (`apps/delivery-app/.env`)
See [`apps/delivery-app/.env.example`](apps/delivery-app/.env.example).

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_WS_URL=http://localhost:3001
EXPO_PUBLIC_WS_NAMESPACE=/orders
EXPO_PUBLIC_DEBUG=false
```

---

## Running Apps Individually (without Docker)

### Backend only

```bash
cd apps/delivery-backend
cp .env.example .env        # configure MONGODB_URI, REDIS_HOST, etc.
npm install
npm run start:dev           # hot-reload dev server on :3001
```

### Tests (backend)

```bash
cd apps/delivery-backend
npm run test          # unit tests (Jest)
npm run test:e2e      # integration tests (Supertest + Socket.IO client)
```

> Frontend tests are intentionally omitted — the app is validated via manual testing on device/simulator.

---

## Infrastructure

### CI/CD — `.github/workflows/ci-cd.yml`

GitHub Actions pipeline with four jobs:

| Job | Trigger | Action |
|---|---|---|
| **Test & Lint** | Every PR / push | Jest unit + E2E tests with live MongoDB + Redis services |
| **Build Docker Image** | Push to `main` / tag | Multi-stage `docker build` (validates Dockerfile) |
| **Deploy Staging** *(mocked)* | Push to `main` | Prints what an ECS Fargate rolling deploy would do |
| **Deploy Production** *(mocked)* | Tag `v*.*.*` | Prints what a production ECS promote would do |

Deploy jobs are mocked with `echo` blocks — the commented-out AWS steps are ready to be uncommented once ECR/ECS is provisioned and `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets are added to the repo.

### Scaling Architecture — `infra/scaling-architecture.md`

Documents three layers of horizontal scaling beyond the MVP:

1. **Redis Socket.IO Adapter** — `@socket.io/redis-adapter` ensures WS events are broadcast across multiple backend replicas
2. **Apache Kafka** — async order processing via `orders.created` / `orders.status_updated` topics; NestJS `@nestjs/microservices` producer/consumer
3. **gRPC** — synchronous inter-service calls (e.g., Order Service → Pricing Service) using proto3 contracts

Target AWS infrastructure: ECS Fargate + ALB + AWS MSK + ElastiCache (Redis) + MongoDB Atlas / DocumentDB + Secrets Manager.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 54, React Native 0.81, TypeScript |
| Routing | expo-router 6 (file-based) |
| API | NestJS 11, TypeScript |
| Database | MongoDB 7 (Mongoose ODM) |
| Real-Time | Socket.IO 4 (WebSocket Gateway) |
| Cache / WS Bus | Redis 7 |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions → AWS ECR → ECS Fargate |
| Monorepo | TurboRepo |
