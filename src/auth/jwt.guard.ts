import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private utils: UtilsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException(
        'You are not authorized to perform this action.',
      );
    }

    const token = authorization.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action since you are not logged in.',
      );
    }
    try {
      const decoded = (await this.utils.verifyToken(token)) as any;
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true },
      });
    
      if (!user) {
        throw new UnauthorizedException('Unauthorized.');
      }
    
      req.user = user;
      return true;
    } catch (error) {
      console.error('Token verification or user retrieval error:', error);
    
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Expired token.');
      }
    
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Unauthorized.');
      }
    
      throw new InternalServerErrorException('Error while verifying token.');
    }
  }
}
