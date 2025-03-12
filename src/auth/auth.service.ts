import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LogoutDto } from './dto/logout.dto';
import { VerifyDto } from './dto/verify.dto';
import { User } from '@prisma/client';
import { Request } from 'express';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly config: ConfigService,
  ) { }

  async register(registerDto: RegisterDto, req: Request) {
    const { email, phone, password, name, username } = registerDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone number must be provided');
    } const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with the provided email or phone number already exists',
      );
    }

    if (password && password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    const hashedPassword = await this.utils.hashPassword(password);
    const userRole = await this.prisma.role.findFirst({
      where: { name: 'USER' },
    });

    const user = await this.prisma.user.create({
      data: {
        name,
        username,
        email,
        phone,
        password: hashedPassword,
        roleId: userRole.id,
      },
    });

    const accessToken = await this.utils.createToken(
      { id: user.id.toString(), email: user.email },
      { expiresIn: '1d' },
    );

    const refreshToken = await this.utils.createToken(
      { id: user.id.toString(), email: user.email },
      { expiresIn: '7d' },
    );
    return {
      message: 'User Created Successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          username: user.username,
        },
        accessToken,
        refreshToken,
      },
    };
  }

  async login(credentials: LoginDto, req: Request) {
    const { identifier, password } = credentials;

    if (!identifier || !password) {
      throw new BadRequestException(
        'Please provide both identifier (email/phone/username) and password',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { username: identifier },
        ],
        deleted: false,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found or account has been deactivated',
      );
    }
    const passwordMatches = await this.utils.verifyPasswords(
      user.password,
      password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.utils.createToken(
      { id: user.id.toString(), email: user.email },
      { expiresIn: '1d' },
    );

    const refreshToken = await this.utils.createToken(
      { id: user.id.toString(), email: user.email },
      { expiresIn: '7d' },
    );
    return {
      message: 'Successfully logged in',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          username: user.username,
        },
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(data: RefreshTokenDto, req: Request) {
    const { refreshToken } = data;
    const userAgent = req.headers['user-agent'] || 'unknown';
    if (!userAgent) {
      throw new UnauthorizedException('Unauthorized');
    }

    const decoded = await this.utils.verifyToken(refreshToken) as any;
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id },
    });

    const accessToken = await this.utils.createToken(
      { id: user.id.toString(), userId: user.email },
      { expiresIn: '1d' },
    );

    const newRefreshToken = await this.utils.createToken(
      { id: user.id.toString(), userId: user.email },
      { expiresIn: '7d' },
    );

    return {
      message: 'Successfully refreshed token',
      data: {
        accessToken,
        newRefreshToken,
      },
    };
  }




  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { name: user.name, email: user.email, phone: user.phone };
  }

  // async logout(logoutDto: LogoutDto) {
  //   const { token } = logoutDto;
  //   if (!token) {
  //     throw new BadRequestException('Token must be provided');
  //   }
  //   try {
  //     await this.prisma.session.update({
  //       where: {
  //         accessToken: token
  //       }, data: {
  //         loggedOut: true
  //       }
  //     })
  //     return { message: 'Successfully logged out' };
  //   } catch (error) {
  //     throw new BadRequestException(
  //       'An error occurred while logging out. Please try again later',
  //     );
  //   }
  // }

  async socialLogin(socialLoginDto: SocialLoginDto) {
    const { socialToken, provider } = socialLoginDto;
    if (!socialToken || !provider) {
      throw new BadRequestException(
        'Social token and provider must be provided',
      );
    }
    try {
      const userInfo = await this.utils.verifySocialToken(
        socialToken,
        provider,
      );

      if (!userInfo) {
        throw new UnauthorizedException('Invalid social token');
      }

      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: userInfo.email }, { phone: userInfo.phone }],
        },
      });
      const userRole = await this.prisma.role.findFirst({
        where: { name: 'USER' },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: userInfo.email,
            phone: userInfo.phone,
            name: userInfo.name,
            username: userInfo.username,
            roleId: userRole.id,
          },
        });
      }

      const accessToken = await this.utils.createToken(
        { id: user.id.toString(), email: user.email },
        { expiresIn: '1d' },
      );

      const refreshToken = await this.utils.createToken(
        { id: user.id.toString(), email: user.email },
        { expiresIn: '7d' },
      );

      return {
        message: 'Successfully logged in with social account',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            username: user.username,
          },
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        'An error occurred during social login. Please try again later',
      );
    }
  }

  // async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
  //   const { identifier } = forgotPasswordDto;

  //   if (!identifier) {
  //     throw new BadRequestException(
  //       'Identifier (email or phone number) must be provided',
  //     );
  //   }

  //   try {
  //     const user = await this.prisma.user.findFirst({
  //       where: {
  //         OR: [
  //           { email: identifier, deleted: false },
  //           { phone: identifier, deleted: false },
  //         ],
  //       },
  //     });

  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     const token = this.utils.createToken({ identifier }, { expiresIn: "1h" });
  //     if (user.phone === identifier) {
  //       await this.utils.sendOtpToPhone(identifier, token, 'password-reset');
  //     }
  //     if (user.email === identifier) {
  //       await this.utils.sendOtpToEmail(user, token, 'password-reset');
  //     }

  //     await this.prisma.otpToken.create({
  //       data: {
  //         user: { connect: { id: user.id } },
  //         type: 'password-reset',
  //         otp,
  //         expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  //       },
  //     });

  //     return { message: 'Password reset otp sent to your email or phone' };
  //   } catch (error) {
  //     throw new BadRequestException(
  //       'An error occurred while sending the reset link. Please try again later',
  //     );
  //   }
  // }
  // async resetPassword(data: ResetPasswordDto) {
  //   const { newPassword, resetToken } = data;
  //   try {
  //     const token = await this.prisma.otpToken.findFirst({
  //       where: {
  //         token: resetToken,
  //         type: 'password-reset',
  //         used: false,
  //       },
  //     });
  //     if (!token) {
  //       throw new BadRequestException('Invalid Token Provided');
  //     }
  //     const currentTime = new Date();
  //     const otpExpiresAt = new Date(token.expiresAt);
  //     const timeDifference = (otpExpiresAt.getTime() - currentTime.getTime()) / 1000 / 60;

  //     if (timeDifference < 60) {
  //       throw new BadRequestException('OTP has expired. Please request a new one');
  //     }
  //     const hashedPassword = await this.utils.hashPassword(newPassword);
  //     await this.prisma.user.update({
  //       where: { id: token.userId },
  //       data: { password: hashedPassword },
  //     });

  //     return {
  //       message: 'Password successfully updated.',
  //     };
  //   } catch (error) {
  //     console.error('Error during password reset:', error);
  //     throw new UnauthorizedException(
  //       'An error occurred while updating your password. Please try again later',
  //     );
  //   }
  // }


  async changePassword(changePasswordDto: ChangePasswordDto, user: User) {
    const { newPassword, oldPassword } = changePasswordDto;

    try {
      const passwordMatches = await this.utils.verifyPasswords(
        user.password,
        oldPassword,
      );
      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const hashedPassword = await this.utils.hashPassword(newPassword);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset link sent to your email or phone' };
    } catch (error) {
      throw new BadRequestException(
        'An error occurred while sending the reset link. Please try again later',
      );
    }
  }
}
