import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'New password for the user' })
  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @ApiProperty({ description: 'Reset token for password change' })
  @IsNotEmpty()
  @IsString()
  resetToken: string;
}
