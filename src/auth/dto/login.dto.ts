import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Email ,phone,username' })
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  password: string;
}
