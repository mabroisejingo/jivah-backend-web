import { User, Role } from '@prisma/client';

export type UserWithRole = User & { role: Role };
