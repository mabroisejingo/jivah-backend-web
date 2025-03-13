import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty()
  @IsString()
  inventoryId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;
}
