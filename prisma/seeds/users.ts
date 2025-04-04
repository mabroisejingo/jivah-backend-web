import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

export async function seedAdminUser(prisma: PrismaClient) {
  const adminPassword = await argon2.hash('Jivah@123');

  const adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      roleId: adminRole.id,
      emailVerified: true,
      phoneVerified: true,
      phone: '1111111111',
    },
  });
}
