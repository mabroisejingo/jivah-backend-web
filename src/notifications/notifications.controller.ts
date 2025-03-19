import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAllNotifications(@Req() req: Request) {
    return this.notificationsService.getAllNotifications(req.user.id);
  }

  @Patch(':id/read')
  readNotification(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.readNotification(id, req.user.id);
  }

  @Patch('read-all')
  readAllNotifications(@Req() req: Request) {
    return this.notificationsService.readAllNotifications(req.user.id);
  }
}
