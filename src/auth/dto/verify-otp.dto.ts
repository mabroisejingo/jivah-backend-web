import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number of the user (either phone or email is required)',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.email)
  phone?: string;

  @ApiProperty({
    description: 'Email address of the user (either phone or email is required)',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @ValidateIf((o) => !o.phone)
  email?: string;

  @ApiProperty({
    description: 'One-time password (OTP) sent to the user',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  otp: string;
}
