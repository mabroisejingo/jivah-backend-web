import { User } from '@prisma/client';
import * as multer from 'multer';
import { UserWithRole } from 'src/types/user';

declare global {
  namespace Express {
    interface Request {
      file: multer.File;
      user?: UserWithRole;
    }
  }
}
