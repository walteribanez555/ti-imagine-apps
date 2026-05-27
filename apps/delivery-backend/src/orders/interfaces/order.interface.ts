import { OrderStatus } from '../schemas/order.schema';

export interface ICoordinates {
  lat: number;
  lng: number;
}

export interface IOrder {
  _id: string;
  customerName: string;
  deliveryAddress: string;
  status: OrderStatus;
  coordinates: ICoordinates | null;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderEventName = 'order:created' | 'order:status_updated';

export interface IOrderEvent {
  event: OrderEventName;
  data: IOrder;
}
