import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus, {
    message: `status must be one of: ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;
}
