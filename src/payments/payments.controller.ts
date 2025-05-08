import { Controller, Post, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate/:saleId')
  async initiatePayment(@Param('saleId') saleId: string) {
    const paymentToken = await this.paymentsService.initiatePayment(saleId);
    return { paymentToken };
  }

  @Post('callback')
  async handlePaymentCallback(@Body() requestBody: any) {
    await this.paymentsService.handlePaymentCallback(requestBody);
  }
}
