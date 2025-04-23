import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDiscountDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  percentage: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  startHour?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  endHour?: number;
}
