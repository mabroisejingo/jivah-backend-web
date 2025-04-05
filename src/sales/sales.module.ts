import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [NotificationsModule, PaymentsModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
