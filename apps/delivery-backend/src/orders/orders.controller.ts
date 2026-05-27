import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { IOrder } from './interfaces/order.interface';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrderDto): Promise<IOrder> {
    const order = await this.ordersService.create(dto);

    this.ordersGateway.emitOrderCreated(order);

    return order;
  }

  @Get()
  findAll(): Promise<IOrder[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<IOrder> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<IOrder> {
    const order = await this.ordersService.updateStatus(id, dto);

    this.ordersGateway.emitOrderStatusUpdated(order);

    return order;
  }
}
