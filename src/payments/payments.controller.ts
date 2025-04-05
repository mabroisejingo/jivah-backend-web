import { Controller, Post, Param, Query } from '@nestjs/common';
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
  async handlePaymentCallback(
    @Query('transactionId') transactionId: string,
    @Query('saleId') saleId: string,
    @Query('status') status: string,
  ) {
    await this.paymentsService.handlePaymentCallback(
      transactionId,
      saleId,
      status,
    );
    return { success: true };
  }
}
