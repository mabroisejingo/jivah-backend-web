import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: 'Authentication token to be invalidated' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
