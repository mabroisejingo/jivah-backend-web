import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  roles = [{ name: 'user' }, { name: 'admin' }];
  async onModuleInit() {
    await this.$connect();
  }
}
