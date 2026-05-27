import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { IOrder, ICoordinates } from './interfaces/order.interface';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async create(dto: CreateOrderDto): Promise<IOrder> {
    const coordinates = dto.coordinates ?? this.simulateCoordinates();

    const created = await this.orderModel.create({ ...dto, coordinates });
    this.logger.log(`Order created: ${String(created._id)}`);

    return this.toPlainObject(created);
  }

  async findAll(): Promise<IOrder[]> {
    const docs = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return docs.map(this.mapLeanDoc);
  }

  async findOne(id: string): Promise<IOrder> {
    const doc = await this.orderModel.findById(id).lean().exec();

    if (!doc) {
      throw new NotFoundException(`Order with id "${id}" was not found`);
    }

    return this.mapLeanDoc(doc);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<IOrder> {
    const doc = await this.orderModel
      .findByIdAndUpdate(
        id,
        { status: dto.status },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!doc) {
      throw new NotFoundException(`Order with id "${id}" was not found`);
    }

    this.logger.log(`Order ${id} status → ${dto.status}`);

    return this.mapLeanDoc(doc);
  }

  private simulateCoordinates(): ICoordinates {
    const lat = 19.3 + Math.random() * 0.5;
    const lng = -99.2 + Math.random() * 0.4;
    return {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
    };
  }

  private toPlainObject(doc: OrderDocument): IOrder {
    const obj = doc.toObject({ versionKey: false });
    return this.mapLeanDoc(obj);
  }

  private mapLeanDoc = (doc: Record<string, unknown>): IOrder => ({
    _id: String(doc._id),
    customerName: doc.customerName as string,
    deliveryAddress: doc.deliveryAddress as string,
    status: doc.status as IOrder['status'],
    coordinates: (doc.coordinates as ICoordinates | undefined) ?? null,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  });
}
