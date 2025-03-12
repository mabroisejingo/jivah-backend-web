import { PrismaClient, Privilege } from "@prisma/client";

export async function seedRoles(prisma: PrismaClient) {
    const roles = [
        {
            name: "USER",
            privileges: [Privilege.VIEW_RIDES, Privilege.CHAT, Privilege.BOOK_RIDE],
        },
        {
            name: "ADMIN",
            privileges: [
                Privilege.VIEW_RIDES,
                Privilege.MANAGE_RIDE,
                Privilege.MANAGE_USERS,
                Privilege.CHAT,
                Privilege.MANAGE_CARS,
                Privilege.MANAGE_DRIVERS,
            ],
        },
        {
            name: "DRIVER",
            privileges: [Privilege.MANAGE_RIDE, Privilege.CHAT],
        },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {
                privileges: role.privileges,
            },
            create: {
                name: role.name,
                privileges: role.privileges,
            },
        });
    }
}
