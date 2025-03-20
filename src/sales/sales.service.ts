import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { GetSalesDto } from './dto/get-sales.dto';
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
    getSalesDto: GetSalesDto,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    const { status, page = 1, limit = 10 } = getSalesDto;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
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
