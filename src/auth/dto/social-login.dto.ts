import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SocialLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;
}
