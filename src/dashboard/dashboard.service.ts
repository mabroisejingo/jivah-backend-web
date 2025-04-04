import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(dateRange: string) {
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date;

    if (dateRange === 'today') {
      startDate = new Date(currentDate.setHours(0, 0, 0, 0));
      endDate = new Date(currentDate.setHours(23, 59, 59, 999));
    } else if (dateRange === 'thisWeek') {
      const dayOfWeek = currentDate.getDay();
      const diffToStartOfWeek =
        currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(currentDate.setDate(diffToStartOfWeek));
      endDate = new Date(currentDate.setDate(diffToStartOfWeek + 6));
    } else if (dateRange === 'thisMonth') {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (dateRange === 'thisYear') {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 12, 31);
    } else if (dateRange === 'lifetime') {
      startDate = new Date(0);
      endDate = currentDate;
    } else {
      startDate = new Date(currentDate.setHours(0, 0, 0, 0));
      endDate = new Date(currentDate.setHours(23, 59, 59, 999));
    }

    const [
      salesCount,
      totalSalesAmount,
      inventoryAdded,
      inventorySold,
      newUsers,
      ordersMade,
    ] = await Promise.all([
      this.prisma.sale.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
      }),
      this.prisma.saleItem.findMany({
        where: {
          sale: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'COMPLETED', // Ensure that sales are marked as completed
          },
        },
        select: {
          amount: true,
          quantity: true,
        },
      }),
      this.prisma.inventory.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.saleItem.findMany({
        where: {
          sale: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'COMPLETED', // Ensure that sales are completed for inventory sold
          },
        },
        select: {
          quantity: true,
        },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.sale.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          type: 'ORDER', // Only count orders
        },
      }),
    ]);

    // Calculate the total sales amount
    const totalSalesAmountValue = totalSalesAmount.reduce((total, saleItem) => {
      return total + saleItem.amount * saleItem.quantity;
    }, 0);

    // Calculate the total quantity of items sold
    const totalQuantitySold = inventorySold.reduce((total, saleItem) => {
      return total + saleItem.quantity;
    }, 0);

    return {
      salesCount,
      totalSalesAmount: totalSalesAmountValue,
      inventoryAdded,
      inventorySold: totalQuantitySold,
      newUsers,
      ordersMade,
    };
  }

  async generateReport(dateRange: string) {
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date;

    if (dateRange === 'today') {
      startDate = new Date(currentDate.setHours(0, 0, 0, 0));
      endDate = new Date(currentDate.setHours(23, 59, 59, 999));
    } else if (dateRange === 'thisWeek') {
      const dayOfWeek = currentDate.getDay();
      const diffToStartOfWeek =
        currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(currentDate.setDate(diffToStartOfWeek));
      endDate = new Date(currentDate.setDate(diffToStartOfWeek + 6));
    } else if (dateRange === 'thisMonth') {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (dateRange === 'thisYear') {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 12, 31);
    } else if (dateRange === 'lifetime') {
      startDate = new Date(0);
      endDate = currentDate;
    } else {
      startDate = new Date(currentDate.setHours(0, 0, 0, 0));
      endDate = new Date(currentDate.setHours(23, 59, 59, 999));
    }

    const [salesData, inventoryData, orderData, productData] =
      await Promise.all([
        this.prisma.sale.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
          include: {
            items: true,
            saleClient: true,
          },
        }),
        this.prisma.inventory.findMany({
          where: { createdAt: { gte: startDate, lte: endDate } },
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        }),
        this.prisma.sale.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            type: 'ORDER',
          },
          include: {
            items: true,
            saleClient: true,
          },
        }),
        this.prisma.product.findMany({
          where: { createdAt: { gte: startDate, lte: endDate } },
          include: {
            variants: true,
            category: true,
          },
        }),
      ]);

    const doc = new jsPDF();
    doc.setTextColor(234, 160, 70);
    doc.setFontSize(18);
    doc.text('Jivah Collections Business Report', 14, 20);

    doc.setFontSize(14);
    doc.text(`Date Range: ${dateRange}`, 14, 30);
    doc.text(`Report Generated: ${currentDate.toLocaleString()}`, 14, 40);

    doc.setFontSize(12);
    doc.text('Sales Summary', 14, 50);

    // Sales Table
    const salesTable = salesData.map((sale) => [
      sale.id,
      sale.saleClient?.[0].name,
      sale.items.reduce((acc, item) => acc + item.amount, 0).toFixed(2),
      sale.createdAt.toLocaleDateString(),
    ]);
    autoTable(doc, {
      head: [['Sale ID', 'Client', 'Amount', 'Date']],
      body: salesTable,
      startY: 60,
      theme: 'striped',
    });

    doc.addPage();
    doc.text('Inventory Summary', 14, 20);

    // Inventory Table
    const inventoryTable = inventoryData.map((item) => [
      item.variant.product.name,
      item.variant.color,
      item.variant.size,
      item.quantity,
      item.price.toFixed(2),
    ]);
    autoTable(doc, {
      head: [['Product', 'Color', 'Size', 'Quantity', 'Price']],
      body: inventoryTable,
      startY: 30,
      theme: 'striped',
    });

    doc.addPage();
    doc.text('Orders Summary', 14, 20);

    // Orders Table
    const ordersTable = orderData.map((order) => [
      order.id,
      order.saleClient?.[0].name,
      order.items.reduce((acc, item) => acc + item.amount, 0).toFixed(2),
      order.createdAt.toLocaleDateString(),
    ]);
    autoTable(doc, {
      head: [['Order ID', 'Client', 'Amount', 'Date']],
      body: ordersTable,
      startY: 30,
      theme: 'striped',
    });

    doc.addPage();
    doc.text('Product Summary', 14, 20);

    // Product Table
    const productTable = productData.map((product) => [
      product.name,
      product.category?.name ?? 'No Category',
      product.variants
        .map((variant) => `${variant.color} - ${variant.size}`)
        .join(', '),
    ]);
    autoTable(doc, {
      head: [['Product Name', 'Category', 'Variants']],
      body: productTable,
      startY: 30,
      theme: 'striped',
    });

    // Generate PDF as a Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  async getGraphData() {
    const currentDate = new Date();
    const monthsData = [];

    // Loop through the last 12 months
    for (let i = 0; i < 12; i++) {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999,
      );

      // Fetch the necessary data for each month in parallel
      const [userCount, salesCount, inventoryAmount] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        this.prisma.sale.count({
          where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
            status: 'COMPLETED',
          },
        }),
        this.prisma.saleItem.findMany({
          where: {
            sale: {
              createdAt: { gte: startOfMonth, lte: endOfMonth },
              status: 'COMPLETED',
            },
          },
          select: {
            amount: true,
            quantity: true,
          },
        }),
      ]);

      // Calculate inventory amount (amount * quantity)
      const totalInventoryAmount = inventoryAmount.reduce((total, saleItem) => {
        return total + saleItem.amount * saleItem.quantity;
      }, 0);

      monthsData.push({
        month: `${startOfMonth.getMonth() + 1}-${startOfMonth.getFullYear()}`,
        userCount,
        salesCount,
        inventoryAmount: totalInventoryAmount,
      });
    }

    return monthsData;
  }

  async getMostSoldProducts(dateRange: string) {
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date;

    if (dateRange === 'today') {
      startDate = new Date(currentDate.setHours(0, 0, 0, 0));
      endDate = new Date(currentDate.setHours(23, 59, 59, 999));
    } else if (dateRange === 'thisWeek') {
      const dayOfWeek = currentDate.getDay();
      const diffToStartOfWeek =
        currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(currentDate.setDate(diffToStartOfWeek));
      endDate = new Date(currentDate.setDate(diffToStartOfWeek + 6));
    } else if (dateRange === 'thisMonth') {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (dateRange === 'thisYear') {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 12, 31);
    } else if (dateRange === 'lifetime') {
      startDate = new Date(0);
      endDate = currentDate;
    } else {
      startDate = new Date(currentDate.setHours(0, 0, 0, 0));
      endDate = new Date(currentDate.setHours(23, 59, 59, 999));
    }

    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        inventory: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    // Sum quantities by productId
    const productSales = saleItems.reduce((acc, saleItem) => {
      const productId = saleItem.inventory.variant.productId;
      if (!acc[productId]) {
        acc[productId] = {
          salesMade: 0,
          productName: saleItem.inventory.variant.product.name,
        };
      }
      acc[productId].salesMade += saleItem.quantity;
      return acc;
    }, {});

    // Convert to array and sort by sales quantity
    const sortedSales = Object.entries(productSales)
      //@ts-ignore
      .map(([productId, { salesMade, productName }]) => ({
        productId,
        productName,
        salesMade,
      }))
      .sort((a, b) => b.salesMade - a.salesMade);

    // Return the top 10 most sold products
    return sortedSales.slice(0, 10);
  }
}
