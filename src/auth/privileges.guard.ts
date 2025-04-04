import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Privilege } from '@prisma/client';
import { PRIVILEGES_KEY } from './privileges.decorator';

@Injectable()
export class PrivilegesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPrivileges = this.reflector.getAllAndOverride<
      Privilege[] | string[]
    >(PRIVILEGES_KEY, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new UnauthorizedException('Unauthorized.');
    }

    if (!requiredPrivileges || requiredPrivileges.includes('ALL' as any)) {
      return true;
    }

    if (!user.role.privileges || user.role.privileges.length === 0) {
      throw new UnauthorizedException('User has no privileges.');
    }
    return requiredPrivileges.some((privilege) =>
      user.role.privileges.includes(privilege),
    );
  }
}
