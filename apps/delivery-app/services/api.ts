import axios from 'axios';
import type { IOrder, CreateOrderDto, OrderStatus } from '@/types/order';

// ── Axios instance ────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Orders resource ───────────────────────────────────────────────────────────

export const ordersApi = {
  /** GET /api/orders — sorted newest first */
  findAll: () =>
    apiClient.get<IOrder[]>('/orders').then(r => r.data),

  /** GET /api/orders/:id */
  findOne: (id: string) =>
    apiClient.get<IOrder>(`/orders/${id}`).then(r => r.data),

  /** POST /api/orders — triggers order:created WS event server-side */
  create: (dto: CreateOrderDto) =>
    apiClient.post<IOrder>('/orders', dto).then(r => r.data),

  /** PATCH /api/orders/:id/status — triggers order:status_updated WS event */
  updateStatus: (id: string, status: OrderStatus) =>
    apiClient
      .patch<IOrder>(`/orders/${id}/status`, { status })
      .then(r => r.data),
};
