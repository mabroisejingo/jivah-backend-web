import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import {
  NotificationType,
  Sale,
  SaleStatus,
  SaleType,
  User,
} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PaymentsService } from 'src/payments/payments.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private notificationService: NotificationsService,
    private paymentService: PaymentsService,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Blob> {
    await Promise.all(
      createSaleDto.items.map(async (item) => {
        const inventory = await this.prisma.inventory.findUnique({
          where: { id: item.inventoryId },
          include: { SaleItem: true },
        });

        if (!inventory) {
          throw new NotFoundException(
            `Inventory with ID ${item.inventoryId} not found`,
          );
        }

        const totalSold = inventory.SaleItem.reduce(
          (sum, saleItem) => sum + saleItem.quantity,
          0,
        );
        const remainingStock = inventory.quantity - totalSold;

        if (remainingStock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for inventory ${item.inventoryId}. Only ${remainingStock} remaining.`,
          );
        }

        return inventory;
      }),
    );

    const sale = await this.prisma.sale.create({
      data: {
        status: SaleStatus.COMPLETED,
        paymentMethod: createSaleDto.paymentMethod,
        items: {
          create: createSaleDto.items.map((item) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            amount: item.amount,
          })),
        },
        ...(createSaleDto.client && {
          saleClient: {
            create: {
              name: createSaleDto.client.name,
              email: createSaleDto.client.email,
              phone: createSaleDto.client.phone,
            },
          },
        }),
      },
      include: {
        saleClient: true,
        items: {
          include: {
            inventory: { include: { variant: { include: { product: true } } } },
          },
        },
      },
    });

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Jivah Collections', 14, 20);
    doc.setFontSize(12);
    doc.text('Sale Receipt', 14, 30);
    doc.text(`Sale ID: ${sale.id}`, 14, 40);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 50);

    if (sale.saleClient) {
      doc.text(`Client: ${sale.saleClient[0].name}`, 14, 60);
      doc.text(`Phone: ${sale.saleClient[0].phone}`, 14, 70);
      doc.text(`Email: ${sale.saleClient[0].email}`, 14, 80);
    }

    const itemsTable = sale.items.map((item) => [
      item.inventory.variant.product.name,
      item.inventory.variant.color,
      item.inventory.variant.size,
      item.quantity,
      item.amount.toFixed(2),
    ]);

    autoTable(doc, {
      head: [['Product', 'Color', 'Size', 'Quantity', 'Price']],
      body: itemsTable,
      startY: 90,
      theme: 'striped',
    });

    const totalAmount = sale.items.reduce((sum, item) => sum + item.amount, 0);
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Total: $${totalAmount.toFixed(2)}`, 14, finalY + 10);
    doc.text('Thank you for shopping with us!', 14, finalY + 20);

    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<any> {
    await Promise.all(
      createOrderDto.items.map(async (item) => {
        const inventory = await this.prisma.inventory.findUnique({
          where: { id: item.inventoryId },
          include: { SaleItem: true },
        });

        if (!inventory) {
          throw new NotFoundException(
            `Inventory with ID ${item.inventoryId} not found`,
          );
        }

        const totalSold = inventory.SaleItem.reduce(
          (sum, saleItem) => sum + saleItem.quantity,
          0,
        );
        const remainingStock = inventory.quantity - totalSold;

        if (remainingStock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for inventory ${item.inventoryId}. Only ${remainingStock} remaining.`,
          );
        }

        return inventory;
      }),
    );

    const sale = await this.prisma.sale.create({
      data: {
        status: SaleStatus.PENDING,
        paymentMethod: 'IREMBO_PAY',
        type: SaleType.ORDER,
        items: {
          create: createOrderDto.items.map((item) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            amount: item.amount,
          })),
        },
        ...(createOrderDto.client && {
          saleClient: {
            create: {
              name: createOrderDto.client.name,
              email: createOrderDto.client.email,
              phone: createOrderDto.client.phone,
              address: createOrderDto.client.address,
              city: createOrderDto.client.city,
              country: createOrderDto.client.country,
            },
          },
        }),
      },
      include: {
        saleClient: true,
        items: true,
      },
    });

    if (createOrderDto.client?.email) {
      await this.prisma.cartItem.deleteMany({
        where: {
          user: {
            email: createOrderDto.client.email,
          },
        },
      });
    }

    // const paymentToken = await this.paymentService.initiatePayment(sale.id);
    // return { sale, paymentToken };
    return sale;
  }

  async findAllByProduct(
    productId: string,
    type?: string,
    status?: string,

    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const where: any = {
      items: {
        some: {
          inventory: {
            variant: {
              productId,
            },
          },
        },
      },
    };

    if (status) where.status = status;
    if (type) where.type = type;

    if (startDate) where.createdAt = { ...where.createdAt, gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

    if (search) {
      where.OR = [
        { client: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        {
          items: {
            some: {
              inventory: {
                variant: {
                  product: { name: { contains: search, mode: 'insensitive' } },
                },
              },
            },
          },
        },
      ];
    }

    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              inventory: {
                include: { variant: { include: { product: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { items: sales, total, page, limit };
  }

  async findAll(
    type?: string,
    status?: string,

    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;

    if (startDate) where.createdAt = { ...where.createdAt, gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

    if (search) {
      where.OR = [
        { client: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        {
          items: {
            some: {
              inventory: {
                variant: {
                  product: { name: { contains: search, mode: 'insensitive' } },
                },
              },
            },
          },
        },
      ];
    }

    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          saleClient: true,
          items: {
            include: {
              inventory: {
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
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    const items = sales.map((sale) => ({
      ...sale,
      items: sale.items.map((item) => {
        const productImages = item.inventory.variant.product.images;
        const filteredImage = productImages.find(
          (img) => img.color === item.inventory.variant.color,
        );
        return {
          ...item,
          image: filteredImage.url || null,
        };
      }),
    }));

    return { items, total, page, limit };
  }

  async findAllMine(
    filters: {
      status?: string;
      type?: string;
      page: number;
      limit: number;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    },
    user: User,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    const {
      status,
      type,
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      saleClient: {
        some: {
          email: user.email,
        },
      },
    };

    if (status) where.status = status;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (search) {
      where.OR = [
        {
          saleClient: {
            some: { name: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          saleClient: {
            some: { email: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          items: {
            some: {
              inventory: {
                variant: {
                  product: { name: { contains: search, mode: 'insensitive' } },
                },
              },
            },
          },
        },
      ];
    }

    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          saleClient: true,
          items: {
            include: {
              inventory: {
                include: {
                  variant: {
                    include: {
                      product: {
                        include: {
                          images: true,
                          reviews: {
                            where: { userId: user.id },
                            include: { replies: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    const items = sales.map((sale) => ({
      ...sale,
      items: sale.items.map((item) => {
        const productImages = item.inventory.variant.product.images;
        const filteredImage = productImages.find(
          (img) => img.color === item.inventory.variant.color,
        );
        return {
          ...item,
          image: filteredImage.url || null,
        };
      }),
    }));

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { saleClient: true, items: { include: { inventory: true } } },
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

  async cancelOrder(
    id: string,
    cancelReasonDto: { reason: string },
    user: User,
  ): Promise<Sale> {
    const { reason } = cancelReasonDto;

    if (!reason) {
      throw new BadRequestException('Cancel reason is required.');
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { saleClient: true },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found.`);
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.CANCELLED,
        cancelReason: reason,
      },
    });
    if (user.email !== sale.saleClient[0].email) {
      const title = 'Your Order Has Been Cancelled';
      const notificationMessage = `
        <p>Dear ${sale.saleClient[0].name},</p>
        <p>We regret to inform you that your order with Order ID: <strong>${sale.id}</strong> has been cancelled by the admin.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>We sincerely apologize for any inconvenience this may have caused. If you have any questions, please reach out to our support team.</p>
        <p>Thank you for your understanding.</p>
      `;

      const userToNotify = await this.prisma.user.findUnique({
        where: { email: sale.saleClient[0]?.email },
      });
      const usersToNotify = [userToNotify.id];
      await this.notificationService.createNotification(
        usersToNotify,
        title,
        notificationMessage,
        NotificationType.WARNING,
      );
    }
    return updatedSale;
  }

  async setOrderToDelivering(id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { saleClient: true },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found.`);
    }

    if (
      sale.status === SaleStatus.CANCELLED ||
      sale.status === SaleStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Cannot update a cancelled or refunded order.',
      );
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.DELIVERING,
      },
    });

    const title = 'Your Order is Now Being Delivered';
    const notificationMessage = `
        <p>Dear ${sale.saleClient[0].name},</p>
        <p>Your order with Order ID: <strong>${sale.id}</strong> is now being delivered.</p>
        <p>We are working hard to deliver your items. Please keep an eye out for the delivery.</p>
        <p>Thank you for choosing us!</p>
      `;

    const userToNotify = await this.prisma.user.findUnique({
      where: { email: sale.saleClient[0]?.email },
    });
    const usersToNotify = [userToNotify.id];
    await this.notificationService.createNotification(
      usersToNotify,
      title,
      notificationMessage,
      NotificationType.INFO, // You can change the notification type
    );

    return updatedSale;
  }

  async setOrderToCompleted(id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { saleClient: true },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found.`);
    }

    if (
      sale.status === SaleStatus.CANCELLED ||
      sale.status === SaleStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Cannot update a cancelled or refunded order.',
      );
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.COMPLETED,
      },
    });
    const title = 'Your Order Has Been Completed';
    const notificationMessage = `
        <p>Dear ${sale.saleClient[0].name},</p>
        <p>We are pleased to inform you that your order with Order ID: <strong>${sale.id}</strong> has been completed successfully.</p>
        <p>Thank you for shopping with us. We hope to serve you again soon!</p>
      `;

    const userToNotify = await this.prisma.user.findUnique({
      where: { email: sale.saleClient[0]?.email },
    });
    const usersToNotify = [userToNotify.id];
    await this.notificationService.createNotification(
      usersToNotify,
      title,
      notificationMessage,
      NotificationType.SUCCESS,
    );

    return updatedSale;
  }

  async requestRefund(
    id: string,
    refundRequestDto: { message: string },
  ): Promise<Sale> {
    const { message } = refundRequestDto;

    if (!message) {
      throw new BadRequestException('Refund request message is required.');
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      throw new NotFoundException(`The Sale was not found.`);
    }

    if (
      sale.status === SaleStatus.CANCELLED ||
      sale.status === SaleStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Cannot request a refund for a cancelled or refunded order.',
      );
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.REFUNDED,
        refundReason: message,
      },
    });

    return updatedSale;
  }

  async completeRefund(
    id: string,
    completeRefundDto: {
      message: string;
      action: 'ACCEPT' | 'REJECT';
    },
  ): Promise<Sale> {
    const { message, action } = completeRefundDto;

    if (!message) {
      throw new BadRequestException(
        'Please provide a message explaining the reason for your refund request.',
      );
    }

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      throw new BadRequestException(
        'Invalid action. Please specify either "ACCEPT" or "REJECT".',
      );
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { saleClient: true },
    });

    if (!sale) {
      throw new NotFoundException(
        `We couldn't find an order with ID ${id}. Please check the order ID and try again.`,
      );
    }

    if (sale.status === SaleStatus.REFUNDED) {
      throw new BadRequestException(
        'This order has already been refunded. You cannot request another refund.',
      );
    }

    let updatedSale: Sale;

    if (action === 'ACCEPT') {
      updatedSale = await this.prisma.sale.update({
        where: { id },
        data: {
          status: SaleStatus.REFUNDED,
          refundResponse: message,
        },
      });

      await this.processRefundPayment(sale);

      const title = 'Your Refund Request Has Been Accepted';
      const notificationMessage = `
        <p>Dear Customer,</p>
        <p>Your refund request for Order ID: <strong>${sale.id}</strong> has been accepted.</p>
        <p><strong>Refund Reason:</strong> ${message}</p>
        <p>Your refund is being processed. If you have any questions, feel free to contact us.</p>
        <p>Thank you for your patience.</p>
      `;
      const user = await this.prisma.user.findUnique({
        where: { email: sale.saleClient[0]?.email },
      });
      const usersToNotify = [user.id];
      await this.notificationService.createNotification(
        usersToNotify,
        title,
        notificationMessage,
      );
    }

    if (action === 'REJECT') {
      updatedSale = await this.prisma.sale.update({
        where: { id },
        data: {
          refundResponse: message,
        },
      });

      const title = 'Your Refund Request Has Been Rejected';
      const notificationMessage = `
        <p>Dear Customer,</p>
        <p>Unfortunately, your refund request for Order ID: <strong>${sale.id}</strong> has been rejected.</p>
        <p><strong>Reason:</strong> ${message}</p>
        <p>If you have any questions or need further assistance, please contact our support team.</p>
        <p>Thank you for understanding.</p>
      `;

      const user = await this.prisma.user.findUnique({
        where: { email: sale.saleClient[0]?.email },
      });
      const usersToNotify = [user.id];
      await this.notificationService.createNotification(
        usersToNotify,
        title,
        notificationMessage,
      );
    }

    return updatedSale;
  }
  private async processRefundPayment(sale: Sale): Promise<void> {
    console.log(`Refunding payment for Sale ID: ${sale.id}`);
    // Implement actual refund logic, e.g., communicate with a payment provider
  }
}
