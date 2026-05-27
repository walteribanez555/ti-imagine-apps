# Delivery App — Real-Time Order Tracker

React Native mobile app (Expo SDK 54) for the **Real-Time Order & Delivery Tracker** technical interview project.  
Connects to the NestJS backend via REST (Axios) and WebSockets (Socket.IO) to display live order updates.

---

## Screens

| Screen | Route | Description |
|---|---|---|
| **Dashboard** | `/` (tabs/index) | Order list with live counter, filter chips, and WS status |
| **Create Order** | `/modal` | Bottom-sheet form — creates a new order via REST |
| **Order Detail** | `/order/[id]` | Map view, delivery timeline, metrics, mark-delivered button |

### Dashboard
- Stats strip showing counts by status (Pending / In Transit / Delivered)
- Filter chips (All · Pending · In Transit · Delivered) with per-status counts
- `FlatList` of `OrderCard` components — newest first
- Live-border highlight + `PulseDot` animation on incoming Socket.IO orders
- Floating Action Button (FAB) to open the Create Order modal
- `AppHeader` with real-time WebSocket connection indicator

### Create Order
- Full-screen modal (slide from bottom on iOS, fade on Android)
- Fields: Order ID, Customer Name, Destination Address, Notes (optional)
- Client-side validation before calling `POST /api/orders`
- Auto-dismisses and refreshes the dashboard list on success

### Order Detail
- `StylizedMap` — SVG animated route from origin → driver → destination
- Delivery timeline with three steps (Order Placed → In Transit → Delivered)
- Metrics strip: elapsed time, total distance, estimated delivery
- Scrollable detail rows (order ID, customer, origin, destination, notes)
- "Mark as Delivered" button (calls `PATCH /api/orders/:id/status`)
- Subscribes to `order:status_updated` WS event for real-time UI refresh

---

## Design System

All design tokens live in `constants/theme.ts`.

```ts
// Palette
T.bg       = '#FAF8F5'   // warm off-white background
T.surface  = '#FFFFFF'
T.ink      = '#1A1614'   // near-black headings
T.accent   = '#F25C05'   // orange — primary action, In-Transit pill

// Status colours
T.pending   / T.pendingBg   // amber
T.transit   / T.transitBg   // orange
T.delivered / T.deliveredBg // green

// Typography
Fonts.sans  → System / Roboto
Fonts.mono  → Menlo / monospace
```

---

## Environment Variables

Create `apps/delivery-app/.env` (copy from `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://localhost:3001          # NestJS REST base URL
EXPO_PUBLIC_WS_URL=http://localhost:3001           # Socket.IO server URL
EXPO_PUBLIC_WS_NAMESPACE=/orders                  # Socket.IO namespace
EXPO_PUBLIC_DEBUG=true                            # enable WS event logging
```

> All `EXPO_PUBLIC_*` variables are inlined at build time and accessible in the app via `process.env.EXPO_PUBLIC_*`.

---

## Getting Started

### Prerequisites
- Node.js ≥ 22
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator / Android Emulator **or** [Expo Go](https://expo.dev/go) on a physical device
- Backend running (see root `README.md` → Docker quick start)

### Install and run

```bash
cd apps/delivery-app
npm install
npx expo start
```

Press **`i`** for iOS Simulator, **`a`** for Android, or scan the QR code with Expo Go.

---

## Real-Time Architecture

```
┌─────────────────────────────────┐
│         React Native App        │
│                                 │
│  services/api.ts (Axios)        │──── REST ──────────► POST /api/orders
│                                 │                       GET  /api/orders
│                                 │                       PATCH /api/orders/:id/status
│                                 │
│  services/socket.ts (singleton) │──── WS ────────────► /orders namespace
│                                 │◄─── order:created ──
│  hooks/use-orders.ts            │◄─── order:status_updated ──
│   (state + side effects)        │
└─────────────────────────────────┘
```

### Socket.IO events

| Event | Direction | Payload |
|---|---|---|
| `order:created` | Server → Client | `IOrder` |
| `order:status_updated` | Server → Client | `{ orderId, status, updatedAt }` |

The socket is a **singleton** (`services/socket.ts`): a single connection is shared across all screens and survives navigation. Reconnect is automatic.

---

## Project Structure

```
apps/delivery-app/
├── app/                      # Expo Router file-based routing
│   ├── _layout.tsx           # Root stack (tabs + modal + order/[id])
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab navigator (tab bar hidden)
│   │   └── index.tsx         # Dashboard screen
│   ├── modal.tsx             # Create Order modal
│   └── order/
│       └── [id].tsx          # Order Detail screen
│
├── components/
│   ├── ui/                   # Shared primitives
│   │   ├── app-header.tsx    # Header + WS status dot
│   │   ├── fab.tsx           # Orange floating action button
│   │   ├── icons.tsx         # SVG icons (Pin, Plus, Chev, Wifi)
│   │   ├── pulse-dot.tsx     # Animated live indicator
│   │   └── stylized-map.tsx  # SVG route map (grid + route + pins)
│   └── orders/               # Order-specific components
│       ├── filter-chips.tsx  # Horizontal scrollable chips
│       ├── order-card.tsx    # List item card
│       ├── order-timeline.tsx# 3-step delivery timeline
│       ├── stats-strip.tsx   # Pending/Transit/Delivered counts
│       └── status-pill.tsx   # Coloured status badge
│
├── constants/
│   └── theme.ts              # Design tokens (T palette + Fonts)
│
├── hooks/
│   └── use-orders.ts         # Main data hook (REST + WS state)
│
├── services/
│   ├── api.ts                # Axios instance + ordersApi methods
│   └── socket.ts             # Socket.IO singleton
│
└── types/
    └── order.ts              # IOrder, OrderStatus, CreateOrderDto
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 (React Native 0.81) |
| Routing | expo-router 6 (file-based) |
| HTTP | Axios 1.x |
| WebSockets | socket.io-client 4.x |
| SVG | react-native-svg 15 |
| Animations | react-native-reanimated 4 |
| Language | TypeScript 5.9 |
