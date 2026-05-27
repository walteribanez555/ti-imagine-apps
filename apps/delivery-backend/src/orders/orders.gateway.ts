import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { IOrder } from './interfaces/order.interface';

@WebSocketGateway({
  namespace: '/orders',
  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:8081').split(','),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class OrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialised on namespace /orders');
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected    → id: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected → id: ${client.id}`);
  }

  emitOrderCreated(order: IOrder): void {
    this.server.emit('order:created', order);
    this.logger.log(`[order:created] id=${order._id}`);
  }

  emitOrderStatusUpdated(order: IOrder): void {
    this.server.emit('order:status_updated', order);
    this.logger.log(
      `[order:status_updated] id=${order._id} status=${order.status}`,
    );
  }
}
