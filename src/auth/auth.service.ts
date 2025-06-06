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
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { User } from '@prisma/client';
import { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly config: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phone, password, name, username } = registerDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone number must be provided');
    }
    const existingUser = await this.prisma.user.findFirst({
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

  async login(credentials: LoginDto) {
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
      include: { role: true },
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
          role: user.role.name,
        },
        accessToken,
        refreshToken,
      },
    };
  }
  async socialLogin(socialLoginDto: SocialLoginDto) {
    const { token } = socialLoginDto;
    if (!token) {
      throw new BadRequestException('Social token must be provided');
    }

    try {
      const userInfo = await this.utils.verifySocialToken(token);
      if (!userInfo || (!userInfo.email && !userInfo.phone)) {
        throw new UnauthorizedException(
          'Invalid social token or missing essential user data',
        );
      }

      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            userInfo.email ? { email: userInfo.email } : undefined,
            userInfo.phone ? { phone: userInfo.phone } : undefined,
          ].filter(Boolean), // Removes undefined conditions
        },
      });

      if (!user) {
        const userRole = await this.prisma.role.findFirst({
          where: { name: 'USER' },
        });

        user = await this.prisma.user.create({
          data: {
            email: userInfo.email || null,
            phone: userInfo.phone || null,
            name: userInfo.name || 'Unknown User',
            username: userInfo.name || `user_${Date.now()}`,
            roleId: userRole?.id ?? null,
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

  async refresh(data: RefreshTokenDto, req: Request) {
    const { refreshToken } = data;
    const userAgent = req.headers['user-agent'] || 'unknown';
    if (!userAgent) {
      throw new UnauthorizedException('Unauthorized');
    }

    const decoded = (await this.utils.verifyToken(refreshToken)) as any;
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

  async setPassword(token: string, newPassword: string): Promise<User> {
    const decodedToken: any = await this.utils.verifyToken(token);

    if (!decodedToken || !decodedToken.id) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const existingToken = await this.prisma.token.findFirst({
      where: {
        userId: user.id,
        token,
        type: 'PASSWORD_SET',
      },
    });

    if (!existingToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await this.utils.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.token.deleteMany({
      where: { userId: user.id, type: 'PASSWORD_SET' },
    });

    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }
    const token = await this.utils.createToken(
      { id: user.id.toString(), email: user.email },
      { expiresIn: '1h' },
    );
    await this.prisma.token.create({
      data: {
        token,
        userId: user.id,
        type: 'PASSWORD_SET',
      },
    });
    await this.utils.sendPasswordResetEmail(token, user.email);
  }

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
