import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtGuard } from '../auth/jwt.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PrivilegesGuard } from 'src/auth/privileges.guard';
import { Privileges } from 'src/auth/privileges.decorator';
import { Privilege } from '@prisma/client';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtGuard, PrivilegesGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Privileges(Privilege.VIEW_CART)
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'User cart retrieved successfully' })
  async getCart(@Req() req: Request) {
    const userId = req.user['id'];
    return this.cartService.getCart(userId);
  }

  @Post('add')
  @Privileges(Privilege.UPDATE_CART)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  async addToCart(@Req() req: Request, @Body() addToCartDto: AddToCartDto) {
    const userId = req.user['id'];
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Patch('update/:itemId')
  @Privileges(Privilege.UPDATE_CART)
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  async updateCartItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const userId = req.user['id'];
    return this.cartService.updateCartItem(userId, itemId, updateCartItemDto);
  }

  @Delete('remove/:itemId')
  @Privileges(Privilege.UPDATE_CART)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  async removeFromCart(@Req() req: Request, @Param('itemId') itemId: string) {
    const userId = req.user['id'];
    return this.cartService.removeFromCart(userId, itemId);
  }

  @Delete('empty')
  @Privileges(Privilege.DELETE_CART)
  @ApiOperation({ summary: 'Empty cart' })
  @ApiResponse({ status: 200, description: 'Cart emptied successfully' })
  async emptyCart(@Req() req: Request) {
    const userId = req.user['id'];
    return this.cartService.emptyCart(userId);
  }
}
