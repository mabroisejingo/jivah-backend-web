import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

export async function seedAdminUser(prisma: PrismaClient) {
  const adminPassword = await argon2.hash('jivah@123');

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
      phone: '1111111111',
    },
  });
}
