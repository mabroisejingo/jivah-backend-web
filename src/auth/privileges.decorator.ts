import { SetMetadata } from '@nestjs/common';
import { Privilege } from '@prisma/client';

export const PRIVILEGES_KEY = 'privileges';
export const Privileges = (...privileges: (Privilege | 'ALL')[]) =>
  SetMetadata(PRIVILEGES_KEY, privileges);
