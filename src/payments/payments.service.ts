import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SaleStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import fetch from 'node-fetch';

@Injectable()
export class PaymentsService {
  private accessToken: string;

  constructor(private prisma: PrismaService) {}

  async initiatePayment(saleId: string): Promise<string> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, saleClient: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    await this.generateAccessToken();
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

    const paymentData = {
      accountNumber: paymentInfo.accountNumber,
      amount: '5000',
      currency: 'TZS',
      externalId: saleId,
      provider: 'Airtel',
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };

    const paymentResponse = await fetch(
      'https://sandbox.azampay.co.tz/azampay/mno/checkout',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      },
    );

    const paymentJson:any = await paymentResponse.json();

    console.log(paymentJson);

    if (paymentJson?.success) {
      await this.prisma.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.PAYMENT_PENDING,
          saleClient: {
            update: {
              where: { id: sale.saleClient[0].id },
              data: {
                paymentInfo: JSON.stringify({
                  ...paymentInfo,
                  paymentId: paymentJson.transactionId,
                }),
              },
            },
          },
        },
      });
    } else {
      throw new BadRequestException(paymentJson.message);
    }

    return paymentJson?.transactionId ?? 'Unknown';
  }

  async handlePaymentCallback(requestBody: any): Promise<void> {
    const saleId = requestBody.utilityref;

    if (requestBody.transactionstatus != 'success') return;

    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new BadRequestException('Sale not found');
    }

    await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        status: SaleStatus.PENDING,
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
