import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id/id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('deactivate/:id/id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    const userId = req.user['id'];
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async updateProfile(
    @Req() req,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateUserProfileDto);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(@Req() req) {
    const userId = req.user.id;
    return this.usersService.deleteAccount(userId);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.id;
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Post('favorite')
  @ApiOperation({ summary: 'Toggle favorite status of a product' })
  @ApiResponse({
    status: 200,
    description: 'Favorite status toggled successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async toggleFavorite(@Req() req, @Body('productId') productId: string) {
    const userId = req.user.id;
    return this.usersService.toggleFavorite(userId, productId);
  }
}
