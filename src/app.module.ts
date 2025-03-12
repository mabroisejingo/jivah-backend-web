import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PrismaModule,
    UtilsModule,
    ProductsModule,
    InventoryModule,
    FileUploadModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
