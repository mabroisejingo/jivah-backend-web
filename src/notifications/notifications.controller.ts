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

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
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
  readNotification(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.readNotification(id, req.user.id);
  }

  @Patch('read-all')
  readAllNotifications(@Req() req: Request) {
    return this.notificationsService.readAllNotifications(req.user.id);
  }
}
