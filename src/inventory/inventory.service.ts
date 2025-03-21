import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}
  async findAll(params: {
    page?: number;
    limit?: number;
    orderBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      category?: string;
      tags?: string[];
      colors?: string[];
      sizes?: string[];
      search?: string;
    };
  }) {
    const { page = 1, limit = 10, orderBy, sortOrder, filters } = params;
    const where: any = {};

    if (filters) {
      if (filters.minPrice)
        where.variant = { price: { gte: filters.minPrice } };
      if (filters.maxPrice)
        where.variant = {
          price: { ...where.variant?.price, lte: filters.maxPrice },
        };
      if (filters.category)
        where.variant = { product: { category: { name: filters.category } } };
      if (filters.tags)
        where.variant = { product: { tags: { hasSome: filters.tags } } };
      if (filters.colors) where.variant = { color: { in: filters.colors } };
      if (filters.sizes) where.variant = { size: { in: filters.sizes } };
      if (filters.search) {
        where.OR = [
          {
            variant: {
              product: {
                name: { contains: filters.search, mode: 'insensitive' },
              },
            },
          },
          {
            variant: {
              product: {
                category: {
                  name: { contains: filters.search, mode: 'insensitive' },
                },
              },
            },
          },
          {
            variant: {
              product: {
                description: { contains: filters.search, mode: 'insensitive' },
              },
            },
          },
          { variant: { product: { tags: { hasSome: [filters.search] } } } },
        ];
      }
    }

    const inventories = await this.prisma.inventory.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderBy ? { [orderBy]: sortOrder || 'asc' } : undefined,
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        Sale: true,
      },
    });

    const total = await this.prisma.inventory.count({ where });

    const itemsWithSoldQuantity = inventories.map((inventory) => {
      const soldQuantity = inventory.Sale.reduce(
        (sum, sale) => sum + sale.quantity,
        0,
      );
      return { ...inventory, soldQuantity };
    });

    return { items: itemsWithSoldQuantity, total, page, limit };
  }

  async findByProduct(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [inventories, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { variant: { productId } },
        include: { variant: true, discounts: true, Sale: true },
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where: { variant: { productId } } }),
    ]);

    if (inventories.length === 0) {
      throw new NotFoundException(
        `No inventory found for product with ID ${productId}`,
      );
    }

    const itemsWithSoldQuantity = inventories.map((inventory) => {
      const soldQuantity = inventory.Sale.reduce(
        (sum, sale) => sum + sale.quantity,
        0,
      );
      return { ...inventory, soldQuantity };
    });

    return { total, page, limit, items: itemsWithSoldQuantity };
  }

  async findByVariant(variantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [inventories, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { variantId },
        include: { variant: { include: { product: true } }, Sale: true },
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where: { variantId } }),
    ]);

    if (inventories.length === 0) {
      throw new NotFoundException(
        `No inventory found for variant with ID ${variantId}`,
      );
    }

    const itemsWithSoldQuantity = inventories.map((inventory) => {
      const soldQuantity = inventory.Sale.reduce(
        (sum, sale) => sum + sale.quantity,
        0,
      );
      return { ...inventory, soldQuantity };
    });

    return { total, page, limit, items: itemsWithSoldQuantity };
  }

  async findOne(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async create(createInventoryDto: CreateInventoryDto) {
    const { variantId, quantity, price } = createInventoryDto;
    const existingInventory = await this.prisma.inventory.findFirst({
      where: {
        variantId,
        price,
      },
    });

    if (existingInventory) {
      return this.prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: existingInventory.quantity + quantity,
        },
      });
    } else {
      return this.prisma.inventory.create({
        data: createInventoryDto,
      });
    }
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    return this.prisma.inventory.update({
      where: { id },
      data: updateInventoryDto,
    });
  }

  async remove(id: string) {
    return this.prisma.inventory.update({
      where: { id },
      data: { deleted: true },
    });
  }
}
