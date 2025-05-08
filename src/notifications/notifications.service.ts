import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private utils: UtilsService,
  ) {}

  async getAllNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items: notifications,
      page,
      total: totalCount,
      limit,
    };
  }

  async readNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async readAllNotifications(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async createNotification(
    userIds: string[],
    title: string,
    message: string,
    body?: string,
    type: NotificationType = NotificationType.INFO,
  ) {
    const notifications = [];
    const deviceTokens: string[] = [];

    console.log(userIds);

    // Create notifications in the database and collect device tokens
    for (const userId of userIds) {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
        },
      });

      // Retrieve device tokens for the current user
      const userDevices = await this.prisma.userDevice.findMany({
        where: { userId },
      });
      userDevices.forEach((device) => {
        deviceTokens.push(device.token);
      });

      notifications.push(notification);
    }
    if (deviceTokens.length > 0) {
      try {
        const response = await this.utils.sendNotification(
          deviceTokens,
          title,
          body || message,
        );
        console.log('Successfully sent notifications:', response);
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }

    return notifications;
  }
}
