import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SocialLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  socialToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  provider: string;
}
