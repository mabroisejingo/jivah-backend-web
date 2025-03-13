import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  const roles = [
    {
      name: 'USER',
    },
    {
      name: 'ADMIN',
      // privileges: [
      //   Privilege.VIEW_RIDES,
      //   Privilege.MANAGE_RIDE,
      //   Privilege.MANAGE_USERS,
      //   Privilege.CHAT,
      //   Privilege.MANAGE_CARS,
      //   Privilege.MANAGE_DRIVERS,
      // ],
    },
    {
      name: 'DRIVER',
      // privileges: [Privilege.MANAGE_RIDE, Privilege.CHAT],
    },
  ];

  for (const role of roles) {
    console.log(role);
  }
}
