import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
              },
            },
            discounts: true,
          },
        },
      },
    });

    let totalSubTotal = 0;
    let totalDiscount = 0;

    const items = cartItems.map((item) => {
      const { product, quantity } = item;
      const { color, size } = product.variant;
      const inventoryPrice = product.price;

      let subTotal = inventoryPrice * quantity;
      totalSubTotal += subTotal;

      const discount = product.discounts.reduce((acc, discount) => {
        const currentDate = new Date();
        if (
          currentDate >= discount.startDate &&
          currentDate <= discount.endDate
        ) {
          return acc + subTotal * (discount.percentage / 100);
        }
        return acc;
      }, 0);
      totalDiscount += discount;

      return {
        id: item.id,
        product: {
          name: item.product.variant.product.name,
          description: item.product.variant.product.description,
          image: item.product.variant.product.images.find(
            (image) => image.color === item.product.variant.color,
          )
            ? item.product.variant.product.images.filter(
                (image) => image.color === item.product.variant.color,
              )[0].url
            : item.product.variant.product.images[0].url,
          color,
          size,
        },
        quantity,
        price: item.product.price,
      };
    });

    return {
      items,
      subTotal: totalSubTotal,
      discount: totalDiscount,
      finalTotal: totalSubTotal - totalDiscount,
    };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { inventoryId, quantity } = addToCartDto;
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
    });
    if (!inventory || inventory.quantity < quantity) {
      throw new BadRequestException(
        'The requested quantity is not available in the stock',
      );
    }
    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: { userId, inventoryId: inventoryId },
    });
    if (existingCartItem) {
      return this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      return this.prisma.cartItem.create({
        data: { userId, inventoryId: inventoryId, quantity },
      });
    }
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: cartItem.inventoryId },
    });

    if (!inventory || inventory.quantity < updateCartItemDto.quantity) {
      throw new BadRequestException('Insufficient inventory');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateCartItemDto.quantity },
    });
  }

  async removeFromCart(userId: string, itemId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async emptyCart(userId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }
}
