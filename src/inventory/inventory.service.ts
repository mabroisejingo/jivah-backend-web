import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Discount } from '@prisma/client';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { CreateDiscountDto } from './dto/create-discount.dto';

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
    const where: any = { deleted: false };

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
        SaleItem: true,
      },
    });

    const total = await this.prisma.inventory.count({ where });

    const itemsWithSoldQuantity = inventories.map((inventory) => {
      const soldQuantity = inventory.SaleItem.reduce(
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
        where: { variant: { productId }, deleted: false },
        include: {
          variant: { include: { product: true } },
          discounts: true,
          SaleItem: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where: { variant: { productId } } }),
    ]);

    // If no inventories are found, return an empty response instead of throwing an error
    if (inventories.length === 0) {
      return { total: 0, page, limit, items: [] };
    }

    const itemsWithSoldQuantity = inventories.map((inventory) => {
      const soldQuantity = inventory.SaleItem.reduce(
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
        where: { variantId, deleted: false },
        include: { variant: { include: { product: true } }, SaleItem: true },
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
      const soldQuantity = inventory.SaleItem.reduce(
        (sum, sale) => sum + sale.quantity,
        0,
      );
      return { ...inventory, soldQuantity };
    });

    return { total, page, limit, items: itemsWithSoldQuantity };
  }

  async findOne(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id, deleted: false },
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

  async findOneBarcode(barcode: string) {
    const currentDate = new Date();

    const inventory = await this.prisma.inventory.findFirst({
      where: { barcode, deleted: false },
      include: {
        discounts: {
          where: {
            startDate: { lte: currentDate }, // Discount start date should be less than or equal to today
            endDate: { gte: currentDate }, // Discount end date should be greater than or equal to today
          },
        },
        variant: {
          include: {
            product: {
              include: {
                category: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(`No Inventory found related to the barcode`);
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

  async createDiscount(
    inventoryId: string,
    createDiscountDto: CreateDiscountDto,
  ): Promise<Discount> {
    const { percentage, startDate, endDate,startHour,endHour } = createDiscountDto;

    const discount = await this.prisma.discount.create({
      data: {
        inventoryId,
        percentage,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startHour,
        endHour
      },
    });

    return discount;
  }

  async getAllDiscounts(
    inventoryId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: Discount[]; total: number }> {
    const skip = (page - 1) * limit;
    const totalCount = await this.prisma.discount.count({
      where: { inventoryId },
    });
    const discounts = await this.prisma.discount.findMany({
      where: { inventoryId },
      skip,
      take: limit,
    });

    return {
      items: discounts,
      total: totalCount,
    };
  }

  async updateDiscount(
    id: string,
    updateDiscountDto: UpdateDiscountDto,
  ): Promise<Discount> {
    const { percentage, startDate, endDate } = updateDiscountDto;

    const discount = await this.prisma.discount.update({
      where: { id },
      data: {
        percentage,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return discount;
  }

  async removeDiscount(id: string): Promise<Discount> {
    const discount = await this.prisma.discount.delete({
      where: { id },
    });

    return discount;
  }
}
