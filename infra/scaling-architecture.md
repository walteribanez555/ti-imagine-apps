# Scaling Architecture — Kafka & gRPC

> Part 4.2 of the Prueba Técnica: how this system scales from MVP to production-grade
> using Kafka for heavy messaging and gRPC for microservice communication.

---

## Current MVP Architecture (Single Instance)

```
React Native App
      │
      ├─── REST (Axios)      ─────────────────────┐
      └─── Socket.IO (WS)    ─────────────────────┤
                                                   ▼
                                        ┌─────────────────┐
                                        │  NestJS Backend  │
                                        │  (single node)   │
                                        └────────┬────────┘
                                                 │
                                        ┌────────┴────────┐
                                        │    MongoDB       │
                                        └─────────────────┘
```

**Problem at scale:** Socket.IO uses in-memory pub/sub.
When you run 2+ backend replicas, a WS event emitted by replica A
is never received by clients connected to replica B.

---

## Scaled Architecture with Kafka + Redis Adapter

### Step 1 — Redis Socket.IO Adapter (horizontal WS scaling)

The quickest win: install `@socket.io/redis-adapter` so all replicas
share the same pub/sub channel. Redis is already in the compose stack.

```typescript
// apps/delivery-backend/src/main.ts (scaled version)
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

// Attach adapter to the Socket.IO server exposed by NestJS
const io = app.get(Server);           // NestJS IoAdapter exposes this
io.adapter(createAdapter(pubClient, subClient));
```

Now any replica can emit and every connected client receives it:

```
 Replica A ──emit──► Redis pub/sub ──► Replica A subscribers
                                   ──► Replica B subscribers
                                   ──► Replica C subscribers
```

---

### Step 2 — Kafka for heavy / async order processing

When order volume is high (thousands/minute), synchronous
HTTP → MongoDB → WS becomes a bottleneck. Kafka decouples them.

```
                          ┌─────────────────────────────────────────┐
                          │              AWS MSK (Kafka)             │
                          │                                          │
                          │  Topic: orders.created                   │
                          │  Topic: orders.status_updated            │
                          └──────┬──────────────────────────────────-┘
                                 │                  │
                    ┌────────────┘                  └────────────┐
                    ▼                                            ▼
          ┌──────────────────┐                      ┌──────────────────┐
          │ Order API Service│                      │ Notification Svc │
          │ (NestJS + REST)  │                      │ (NestJS + WS)    │
          │                  │                      │                  │
          │ POST /orders      │                      │ consume topic    │
          │   → save MongoDB  │                      │ → emit Socket.IO │
          │   → produce Kafka │                      │   to all clients │
          └──────────────────┘                      └──────────────────┘
                    │
           ┌────────┴────────┐
           │    MongoDB       │
           └─────────────────┘
```

**NestJS Kafka integration** via `@nestjs/microservices`:

```typescript
// apps/delivery-backend/src/orders/orders.service.ts (scaled)
import { ClientKafka, Client } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  @Client({ transport: Transport.KAFKA, options: {
    client: { brokers: [process.env.KAFKA_BROKER] },
    producer: { allowAutoTopicCreation: true },
  }})
  private kafkaClient: ClientKafka;

  async create(dto: CreateOrderDto): Promise<IOrder> {
    const order = await this.orderModel.create(dto);

    // Async publish — does not block the HTTP response
    this.kafkaClient.emit('orders.created', order);

    return this.toPlainObject(order);
  }
}
```

**Notification microservice** consuming the topic:

```typescript
// apps/notification-service/src/main.ts
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: { brokers: [process.env.KAFKA_BROKER] },
    consumer: { groupId: 'notification-consumer' },
  },
});

// handler
@MessagePattern('orders.created')
handleOrderCreated(@Payload() order: IOrder): void {
  this.ordersGateway.emitOrderCreated(order);  // Socket.IO broadcast
}
```

**Why Kafka?**
- Durable log: events survive restarts and can be replayed
- Multiple consumer groups: analytics, billing, notifications consume independently
- Back-pressure: slow consumers don't block producers
- Retention: rebuild read models after failures

---

### Step 3 — gRPC for synchronous microservice calls

When services need a **synchronous, strongly-typed RPC** (e.g.,
Order Service needs to call a Pricing Service to validate a promo
code before persisting), gRPC is the right tool:

```
┌──────────────────────┐      gRPC / proto3      ┌──────────────────────┐
│  Order API Service   │ ───────────────────────► │  Pricing Service     │
│  (NestJS)            │  ValidatePromo(code)      │  (NestJS)            │
│                      │ ◄───────────────────────  │                      │
└──────────────────────┘   PromoResult{discount}  └──────────────────────┘
```

**Proto definition** (`proto/pricing.proto`):

```proto
syntax = "proto3";
package pricing;

service PricingService {
  rpc ValidatePromo (PromoRequest) returns (PromoResult);
}

message PromoRequest { string code = 1; string orderId = 2; }
message PromoResult   { bool valid = 1; float discount = 2; }
```

**NestJS gRPC client** in Order Service:

```typescript
// Registered in OrdersModule
ClientsModule.register([{
  name: 'PRICING_SERVICE',
  transport: Transport.GRPC,
  options: {
    url:     process.env.PRICING_SERVICE_URL,   // 'pricing-svc:5000'
    package: 'pricing',
    protoPath: join(__dirname, '../proto/pricing.proto'),
  },
}])
```

**Why gRPC over REST for inter-service calls?**
- Binary Protocol Buffers: ~5× smaller payload than JSON
- Strict contract via `.proto` — breaking changes are caught at compile time
- HTTP/2 multiplexing: fewer TCP connections across many services
- Streaming support: useful for real-time price updates feed

---

## Target AWS Architecture (Staging → Production)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AWS (us-east-1)                            │
│                                                                     │
│  ┌──────────┐    ┌─────────────────────────────────────────────┐   │
│  │   ALB    │    │              ECS Fargate Cluster            │   │
│  │(HTTPS)   │───►│                                             │   │
│  └──────────┘    │  ┌──────────────┐   ┌──────────────────┐   │   │
│                  │  │ Order API     │   │ Notification Svc │   │   │
│                  │  │ (3 replicas) │   │ (2 replicas)     │   │   │
│                  │  └──────┬───────┘   └────────┬─────────┘   │   │
│                  └─────────┼────────────────────┼─────────────┘   │
│                            │                    │                  │
│             ┌──────────────┤                    │                  │
│             │              │                    │                  │
│  ┌──────────▼──────┐  ┌────▼──────────┐  ┌─────▼──────────┐      │
│  │ MongoDB Atlas   │  │  AWS MSK      │  │ ElastiCache    │      │
│  │ (or DocumentDB) │  │  (Kafka)      │  │ Redis Cluster  │      │
│  │ M10 cluster     │  │  2 brokers    │  │ (WS adapter)   │      │
│  └─────────────────┘  └───────────────┘  └────────────────┘      │
│                                                                     │
│  ┌─────────────────┐  ┌───────────────┐                           │
│  │ ECR             │  │ Secrets Mgr   │                           │
│  │ (Docker images) │  │ (env secrets) │                           │
│  └─────────────────┘  └───────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Key AWS services used

| Service | Purpose |
|---|---|
| **ECS Fargate** | Serverless container runtime — no EC2 to manage |
| **ALB** | HTTPS termination + WebSocket sticky sessions (`stickiness: lb_cookie`) |
| **ECR** | Private Docker registry (images pushed by CI/CD) |
| **AWS MSK** | Managed Kafka — handles broker setup, replication, monitoring |
| **ElastiCache (Redis)** | Socket.IO adapter bus + API response cache |
| **MongoDB Atlas / DocumentDB** | Managed MongoDB with automatic failover |
| **Secrets Manager** | Injects `MONGODB_URI`, `REDIS_PASSWORD`, etc. at task startup |
| **CloudWatch** | Container logs + custom metrics (orders/min, WS connections) |

---

## Deployment runbook (staging)

```bash
# 1. Authenticate to ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin \
      <account>.dkr.ecr.us-east-1.amazonaws.com

# 2. Build and push (multi-stage)
docker build --target production \
  -t <account>.dkr.ecr.us-east-1.amazonaws.com/delivery-backend:latest \
  apps/delivery-backend
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/delivery-backend:latest

# 3. Force ECS rolling deploy
aws ecs update-service \
  --cluster delivery-cluster \
  --service delivery-backend-staging \
  --force-new-deployment

# 4. Wait for stability
aws ecs wait services-stable \
  --cluster delivery-cluster \
  --services delivery-backend-staging
```

On a tagged release (e.g., `git tag v1.2.0 && git push --tags`),
the GitHub Actions workflow promotes the same ECR image to production
with zero-rebuild — the Fargate task simply swaps the container image.
