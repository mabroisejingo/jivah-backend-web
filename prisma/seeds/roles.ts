import { PrismaClient, Privilege } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  const roles = [
    {
      name: 'USER',
      privileges: [
        Privilege.VIEW_PRODUCTS,
        Privilege.VIEW_ORDERS,
        Privilege.CREATE_ORDERS,
        Privilege.VIEW_CATEGORIES,
        Privilege.VIEW_REVIEWS,
        Privilege.CREATE_REVIEW,
        Privilege.VIEW_FAVORITES,
        Privilege.ADD_FAVORITES,
        Privilege.VIEW_CART,
        Privilege.UPDATE_CART,
        Privilege.DELETE_CART,
      ],
    },
    {
      name: 'ADMIN',
      privileges: Object.values(Privilege),
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { privileges: role.privileges },
      create: {
        name: role.name,
        privileges: role.privileges,
      },
    });
  }
}
