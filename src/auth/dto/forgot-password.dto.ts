import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Email  or phone' })
  identifier: string;
}
