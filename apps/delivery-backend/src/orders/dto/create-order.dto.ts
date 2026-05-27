import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class CoordinatesDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'customerName must not be empty' })
  @MaxLength(120)
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'deliveryAddress must not be empty' })
  @MaxLength(255)
  deliveryAddress: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}
