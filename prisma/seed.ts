import { PrismaClient } from '@prisma/client';
import { seedRoles } from './seeds/roles';
import { seedAdminUser } from './seeds/users';

const prisma = new PrismaClient();

async function main() {
  try {
    await seedRoles(prisma);
    console.log('Roles seeded successfully.');

    await seedAdminUser(prisma);
    console.log('Admin user seeded successfully.');
  } catch (error) {
    console.error('Error while seeding: ', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
