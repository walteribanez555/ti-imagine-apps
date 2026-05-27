import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
}

@Schema({ _id: false })
export class Coordinates {
  @Prop({ type: Number, required: true })
  lat: number;

  @Prop({ type: Number, required: true })
  lng: number;
}

@Schema({ collection: 'orders', timestamps: true })
export class Order {
  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ required: true, trim: true })
  deliveryAddress: string;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: Coordinates, default: null })
  coordinates: Coordinates | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
