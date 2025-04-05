import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SaleItemDto {
  @ApiProperty({ description: 'The ID of the inventory item' })
  @IsString()
  @IsNotEmpty()
  inventoryId: string;

  @ApiProperty({ description: 'The quantity of the item' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'The price of the item' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

class SaleClientDto {
  @ApiProperty({ description: 'Client name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Client email' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Client phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class CreateSaleDto {
  @ApiProperty({ description: 'The payment method used for the sale' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'List of items in the sale',
    type: () => [SaleItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({
    description: 'Client details for non-user purchases',
    type: () => SaleClientDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SaleClientDto)
  client?: SaleClientDto;
}
