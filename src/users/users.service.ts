import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { UtilsService } from '../utils/utils.service';
import { Prisma, User } from '@prisma/client';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private utils: UtilsService,
  ) {}

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'USER' | 'EMPLOYEE';
  }): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const pageNumber = Number(params.page) || 1;
    const limitNumber = Number(params.limit) || 10;
    const search = params.search;
    let role;

    if (params.role == 'USER') {
      role = await this.prisma.role.findFirst({
        where: { name: params.role },
      });
    }

    const where: Prisma.UserWhereInput = {
      deleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { roleId: role.id }),
      NOT: {
        role: {
          name: 'ADMIN',
        },
      },
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users, page: pageNumber, limit: limitNumber, total };
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<User> {
    const { email, name, username, phone, roleId } = createEmployeeDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }, { phone }],
      },
    });

    if (existingUser) {
      throw new Error(
        'User with the same email, username, or phone already exists',
      );
    }

    const employee = await this.prisma.user.create({
      data: {
        email,
        name,
        username,
        phone,
        roleId: roleId,
      },
    });

    // Generate a password setup token
    const token = await this.utils.createToken(
      { id: employee.id.toString(), email: employee.email },
      { expiresIn: '7d' },
    );

    // Store the token in the database
    await this.prisma.token.create({
      data: {
        token,
        userId: employee.id,
        type: 'PASSWORD_SET',
      },
    });

    // Send account setup email
    await this.utils.sendEmployeeAccountSetupEmails(name, token, email);

    return employee;
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async remove(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    try {
      await this.prisma.user.update({
        where: { id },
        data: { deleted: true },
      });
      return { message: 'User deactivated successfully' };
    } catch (error) {
      console.error('Error removing user:', error);
      throw new InternalServerErrorException(
        'An error occurred while removing the user.',
      );
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { ...user, role: user.role.name };
  }

  async updateProfile(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const { name, phone, username } = updateUserProfileDto;

    // Check if username is unique if provided
    if (username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Username is already taken');
      }
    }

    // Check if phone is unique if provided
    if (phone) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Phone number is already in use');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        username: username || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        username: true,
      },
    });

    return updatedUser;
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete the user
    await this.prisma.user.update({
      where: { id: userId },
      data: { deleted: true },
    });

    return { message: 'Account deleted successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.utils.verifyPasswords(
      user.password,
      oldPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedNewPassword = await this.utils.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async toggleFavorite(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const existingFavorite = await this.prisma.favorite.findFirst({
      where: {
        userId: userId,
        productId: productId,
      },
    });

    if (existingFavorite) {
      await this.prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      return { message: 'Product removed from favorites' };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId: userId,
          productId: productId,
        },
      });
      return { message: 'Product added to favorites' };
    }
  }

  async createRole(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: {
        name: createRoleDto.name,
      },
    });

    if (existingRole) {
      throw new HttpException('Role already exists', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.role.create({
      data: createRoleDto,
    });
  }

  async findAllRoles(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const roles = await this.prisma.role.findMany({
      skip,
      take: limit,
      where: {
        NOT: [{ name: 'USER' }, { name: 'ADMIN' }],
      },
    });

    const total = await this.prisma.role.count({
      where: {
        NOT: [{ name: 'USER' }, { name: 'ADMIN' }],
      },
    });

    return {
      items: roles,
      total,
      page,
      limit,
    };
  }

  async findOneRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async removeRole(id: string) {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
