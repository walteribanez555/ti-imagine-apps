/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { io as ioClient, Socket } from 'socket.io-client';

import { AppModule } from '../src/app.module';
import { OrderStatus } from '../src/orders/schemas/order.schema';

/**
 * E2E Integration Test — Full flow:
 *
 *   1. POST /api/orders            → order persisted in MongoDB
 *   2. WebSocket client receives   → order:created event in real time
 *   3. PATCH /api/orders/:id/status → status updated in MongoDB
 *   4. WebSocket client receives   → order:status_updated event
 *
 * Requires a running MongoDB instance.
 * Set MONGODB_URI in .env or the test runner's environment.
 *
 * Run with:  npm run test:e2e
 */
describe('Orders — E2E Integration', () => {
  let app: INestApplication;
  let wsClient: Socket;
  const PORT = 3099; // isolated port to avoid conflicts with the running dev server

  // ── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.listen(PORT);

    // Connect Socket.IO client to the /orders namespace
    wsClient = ioClient(`http://localhost:${PORT}/orders`, {
      transports: ['websocket'],
      forceNew: true,
    });

    await new Promise<void>((resolve, reject) => {
      wsClient.on('connect', resolve);
      wsClient.on('connect_error', reject);
    });
  }, 15_000);

  afterAll(async () => {
    wsClient.disconnect();
    await app.close();
  });

  // ── Helper ─────────────────────────────────────────────────────────────────

  /** Waits up to `timeout` ms for a named WS event, then resolves with its data. */
  const waitForEvent = <T>(event: string, timeout = 5_000): Promise<T> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout waiting for WS event "${event}"`)),
        timeout,
      );
      wsClient.once(event, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('POST /api/orders — 400 when customerName is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .send({ deliveryAddress: 'Av. Reforma 1, CDMX' })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/customerName/)]),
    );
  });

  it('POST /api/orders — 400 when deliveryAddress is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .send({ customerName: 'Carlos López' })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/deliveryAddress/)]),
    );
  });

  // ── Full real-time flow ────────────────────────────────────────────────────

  it('Full flow: create order → WS order:created → update status → WS order:status_updated', async () => {
    // 1. Register WS listeners BEFORE the HTTP call to avoid race conditions
    const createdEventPromise = waitForEvent<any>('order:created');
    const statusEventPromise = waitForEvent<any>('order:status_updated');

    // 2. Create order via REST
    const createRes = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        customerName: 'María García',
        deliveryAddress: 'Insurgentes Sur 1234, CDMX',
      })
      .expect(201);

    const createdOrder = createRes.body;
    expect(createdOrder._id).toBeDefined();
    expect(createdOrder.status).toBe(OrderStatus.PENDING);
    expect(createdOrder.coordinates).not.toBeNull();

    // 3. Assert WebSocket broadcast for creation
    const wsCreated = await createdEventPromise;
    expect(wsCreated._id).toBe(createdOrder._id);
    expect(wsCreated.customerName).toBe('María García');

    // 4. Update status via REST
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/orders/${createdOrder._id}/status`)
      .send({ status: OrderStatus.IN_TRANSIT })
      .expect(200);

    expect(patchRes.body.status).toBe(OrderStatus.IN_TRANSIT);

    // 5. Assert WebSocket broadcast for status change
    const wsUpdated = await statusEventPromise;
    expect(wsUpdated._id).toBe(createdOrder._id);
    expect(wsUpdated.status).toBe(OrderStatus.IN_TRANSIT);
  }, 15_000);

  // ── Read endpoints ─────────────────────────────────────────────────────────

  it('GET /api/orders — returns an array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/orders')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/orders/:id — 404 for an unknown ObjectId', async () => {
    await request(app.getHttpServer())
      .get('/api/orders/000000000000000000000000')
      .expect(404);
  });
});
