import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';
import { PrivilegesGuard } from 'src/auth/privileges.guard';
import { Privileges } from 'src/auth/privileges.decorator';
import { Privilege } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtGuard, PrivilegesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Privileges(Privilege.VIEW_NOTIFICATIONS)
  getAllNotifications(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.id;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.notificationsService.getAllNotifications(
      userId,
      pageNumber,
      limitNumber,
    );
  }

  @Patch(':id/read')
  @Privileges(Privilege.UPDATE_NOTIFICATIONS)
  readNotification(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.readNotification(id, req.user.id);
  }

  @Patch('read-all')
  @Privileges(Privilege.UPDATE_NOTIFICATIONS)
  readAllNotifications(@Req() req: Request) {
    return this.notificationsService.readAllNotifications(req.user.id);
  }
}
