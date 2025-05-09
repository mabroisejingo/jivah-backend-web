import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, SaleStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import fetch from 'node-fetch';
import PaypackJs from "paypack-js";
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private accessToken: string;
  private paypack: any;

  constructor(private prisma: PrismaService,private config: ConfigService,private notificationService:NotificationsService) {
    this.paypack = new PaypackJs({
      client_id: this.config.get<string>("PAYPACK_CLIENT_ID"),
      client_secret: this.config.get<string>("PAYPACK_CLIENT_SECRET"),
    });
  }

  async initiatePayment(saleId: string): Promise<string> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleClient:true,
        items: {
          include: {
            inventory: {
              include: {
                discounts: true,
              },
            },
          },
        },
      },
    });
  
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
  
    const saleDate = sale.createdAt;
  
    let totalAmount = 0;
  
    for (const item of sale.items) {
      const { quantity, inventory } = item;
      const { price, discounts } = inventory;
      const validDiscounts = discounts.filter((discount) => {
        const inDateRange =
          saleDate >= discount.startDate &&
          saleDate <= discount.endDate;
  
        const inHourRange =
          discount.startHour == null ||
          discount.endHour == null ||
          (saleDate.getHours() >= discount.startHour &&
           saleDate.getHours() <= discount.endHour);
  
        return inDateRange && inHourRange;
      });
      const highestDiscount = validDiscounts.reduce((max, d) =>
        d.percentage > max ? d.percentage : max, 0);
  
      const discountedPrice = price * (1 - highestDiscount / 100);
      const itemTotal = discountedPrice * quantity;
  
      totalAmount += itemTotal;
    }
  
    const rawPaymentInfo = sale.saleClient[0].paymentInfo || '{}';
    let paymentInfo;
  
    try {
      paymentInfo =
        typeof rawPaymentInfo === 'string'
          ? JSON.parse(rawPaymentInfo)
          : rawPaymentInfo;
    } catch (error) {
      throw new BadRequestException('Invalid payment info format');
    }
  
    if (!paymentInfo.accountNumber) {
      throw new BadRequestException('Please provide the payment info');
    }
  
    try {
      const paypackPayload = {
        number: paymentInfo.accountNumber,
        // number: "+250798667792",
        // number: "+250793748136",
        amount: totalAmount,
        environment: 'development', 
      };
  
      const paypackResponse: { data: {
        amount: number;
        created_at: string;
        kind: string;
        ref: string;
        status: string;
      } } =
        await this.paypack.cashin(paypackPayload);
  
      await this.prisma.sale.update({
        where: { id: saleId, },
        data: {
          status: SaleStatus.PAYMENT_PENDING,
          transactionRef:paypackResponse.data.ref
        },
      });
  
      return paypackResponse.data.ref;
    } catch (error) {
      console.error(`Payment failed: ${error.message}`);
      throw new BadRequestException('Payment processing failed');
    }
  }
  
  async handlePaymentCallback(requestBody: any): Promise<void> {
    const transactionRef = requestBody.data.ref;
    const transactionStatus = requestBody.data.status;
  
    const sale = await this.prisma.sale.findFirst({
      where: {
        transactionRef: transactionRef,
      },
      include: {
        saleClient:true
      },
    });
  
    if (!sale) {
      throw new BadRequestException('Associated sale not found');
    }

    const user = await this.prisma.user.findFirst({
      where:{
        email:sale.saleClient[0].email
      }
    })
  
    if(user){
      const formattedDate = new Date(sale.createdAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    
      if (transactionStatus !== 'success' && user) {
        const plainMessage = `Your payment for the order you made on Jivah Collections on ${formattedDate} was not successful. Please check your payment method and try again or contact our support team for assistance.`;
        const htmlMessage = `<p>Your payment for the order you made on <strong>Jivah Collections</strong> on <strong>${formattedDate}</strong> was <span style="color: red;">not successful</span>.</p><p>Please check your payment method and try again or contact our support team for assistance.</p>`;
    
        await this.notificationService.createNotification(
          [user.id],
          'Payment Failed',
          plainMessage,
          htmlMessage,
          NotificationType.ERROR,
        );
        return;
      }
    
  
    
      const plainMessage = `Your payment for the order you placed on Jivah Collections on ${formattedDate} was successful. We are now processing your order. Thank you for shopping with us!`;
      const htmlMessage = `<p>Your payment for the order you placed on <strong>Jivah Collections</strong> on <strong>${formattedDate}</strong> was <span style="color: green;">successful</span>.</p><p>We are now processing your order. Thank you for shopping with us!</p>`;
    
      await this.notificationService.createNotification(
        [user.id],
        'Payment Successful',
        plainMessage,
        htmlMessage,
        NotificationType.SUCCESS,
      );
    }

    await this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        status: SaleStatus.COMPLETED,
      },
    });
  }
  

  private async generateAccessToken(): Promise<void> {
    const data = {
      appName: 'Iziworld-rwanda-sandbox-env',
      clientId: '05a3fd0c-ebb2-4fa7-acd9-4fbdf211596b',
      clientSecret:
        'JwrQ6DPJl0I3DKlgisnYNuhym5yUj1nFp8E168Nc3LquTe+9CxsfiGNicOuHPMCx8cW4ZhcBi/A/9d3raKXxQTc/gQLq0spnHlSZ35vhz1CDNe6pHg5R4ae7neQDZbaHTYvLhZMkWGrKM0C2uf9tfsH0vbAlAVQHhId8bnZzF7jR3bRfhA6idXftXdkwI1qsn+q1bu+c+hccVFMDPjLgZVrjCIXI4tp6BaObS4Fvvgv5wOMz4dZi9MDwyqADnpJV5SQ9mdbkidY5ZpnbWciV9vju/6EmnolWtj4qbEJjzTypA+UwuIYdj0Fn9h7IGulG6HdN/CR8+eLKvgwg6Y3ftyYi09Xg43GdX1MUfzShey0iEvWpBd2L/O/lCLv+9YLlNwmOdxvtxr2HJKiKpj/zYJnUK087cO2Oys77cJjtUMlSI355oWc0ku6YMnSoOUEG680NHlZwV4nlbCuXAZXjg0mjvRwh/xCjNauDeU3yshfX0EVI2zmah1dMmUOZu1Hrfv7G4NvSEnsqB/vdp9ofjdNNaGuOQUby8ALDvS/lwyEpwCFGw2kLq0UiS+q58YA7FkoTiDU7W8X07kKPVoT90ThO4svChyGRGLMT5s4PVrhI8GjGGnUITtpZ980xfmsRZVZKHfhqUoN1PkzfTIHWE/CTZhjVkwEt6QNNbEGUyMI=',
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    const tokenResponse = await fetch(
      'https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      },
    );

    const tokenJson:any = await tokenResponse.json();
    console.log(tokenJson);
    if (tokenJson?.data?.accessToken) {
      this.accessToken = tokenJson.data.accessToken;
    } else {
      throw new BadRequestException('Failed to get access token');
    }
  }
}
