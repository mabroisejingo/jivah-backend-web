import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtGuard } from './jwt.guard';
import { Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { VerifyDto } from './dto/verify.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    return this.authService.register(registerDto, req);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() credentials: LoginDto, @Req() req: Request) {
    return this.authService.login(credentials, req);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh authentication token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async refresh(@Body() credentials: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(credentials, req);
  }

  @Post('social/login')
  @ApiOperation({ summary: 'Social login (e.g., Google, Facebook)' })
  @ApiResponse({ status: 200, description: 'Social login successful' })
  @ApiResponse({ status: 400, description: 'Invalid social credentials' })
  async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    return this.authService.socialLogin(socialLoginDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('password/change')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Failed to change password' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(changePasswordDto, req.user);
  }


  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    return this.authService.getProfile(req.user.id);
  }
}
