import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({
    description: 'The ID of the user making the purchase',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'The name of the client for non-user purchases',
    required: false,
  })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiProperty({ description: 'The payment method used for the sale' })
  @IsString()
  paymentMethod: string;

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
