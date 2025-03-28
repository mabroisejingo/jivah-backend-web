import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale, SaleStatus } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: createSaleDto.inventoryId },
      include: { Sale: true },
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory with ID ${createSaleDto.inventoryId} not found`,
      );
    }

    const totalSold = inventory.Sale.reduce(
      (sum, sale) => sum + sale.quantity,
      0,
    );
    console.log(totalSold);
    const remainingStock = inventory.quantity - totalSold;
    console.log(remainingStock);

    if (remainingStock < createSaleDto.quantity) {
      throw new BadRequestException(
        `Not enough stock available. Only ${remainingStock} remaining.`,
      );
    }

    return this.prisma.sale.create({
      data: {
        client: createSaleDto.client ?? null,
        paymentMethod: createSaleDto.paymentMethod,
        quantity: createSaleDto.quantity,
        amount: createSaleDto.amount,
        status: SaleStatus.COMPLETED,
        inventory: {
          connect: { id: createSaleDto.inventoryId },
        },
        ...(createSaleDto.userId && {
          user: { connect: { id: createSaleDto.userId } },
        }),
      },
      include: { inventory: true, user: true },
    });
  }

  async findAll(
    status?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    // Ensure page and limit are valid numbers
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtering by status
    if (status) where.status = status;

    // Searching across multiple fields
    if (search) {
      where.OR = [
        { client: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }, // Assuming user has 'name' field
        {
          inventory: {
            variant: {
              product: { name: { contains: search, mode: 'insensitive' } },
            },
          },
        }, // Assuming Product has 'name'
      ];
    }

    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit, // Ensure limit is a number
        include: {
          inventory: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { items: sales, total, page, limit };
  }

  async findAllByProduct(
    productId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    // Ensure page and limit are valid numbers
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const where: any = {
      inventory: {
        variant: {
          productId,
        },
      },
    };

    // Filtering by status
    if (status) where.status = status;

    // Searching across multiple fields
    if (search) {
      where.OR = [
        { client: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }, // Assuming user has 'name' field
        {
          inventory: {
            variant: {
              product: { name: { contains: search, mode: 'insensitive' } },
            },
          },
        }, // Assuming Product has 'name'
      ];
    }

    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit, // Ensure limit is a number
        include: {
          inventory: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { items: sales, total, page, limit };
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { inventory: true },
    });

    if (!sale) throw new NotFoundException(`Sale with ID ${id} not found`);

    return sale;
  }

  async remove(id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({ where: { id } });

    if (!sale) throw new NotFoundException(`Sale with ID ${id} not found`);

    return this.prisma.sale.update({
      where: { id },
      data: { status: SaleStatus.CANCELLED },
    });
  }
}
