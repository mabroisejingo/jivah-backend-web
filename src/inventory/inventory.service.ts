import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
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
    const { skip, take, orderBy, sortOrder, filters } = params;
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
      skip,
      take,
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
      },
    });

    const total = await this.prisma.inventory.count({ where });

    return { items:inventories, total };
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

  async findByProduct(productId: string) {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        variant: {
          productId,
        },
      },
      include: {
        variant: true,
      },
    });

    if (inventories.length === 0) {
      throw new NotFoundException(
        `No inventory found for product with ID ${productId}`,
      );
    }

    return inventories;
  }

  async findByVariant(variantId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: {
        variantId,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        `No inventory found for variant with ID ${variantId}`,
      );
    }

    return inventory;
  }

  async create(createInventoryDto: CreateInventoryDto) {
    return this.prisma.inventory.create({
      data: createInventoryDto,
    });
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    return this.prisma.inventory.update({
      where: { id },
      data: updateInventoryDto,
    });
  }

  async remove(id: string) {
    return this.prisma.inventory.delete({
      where: { id },
    });
  }
}
