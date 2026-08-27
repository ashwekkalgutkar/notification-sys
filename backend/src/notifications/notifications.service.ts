import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryNotificationsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.channel) {
      where.channel = query.channel;
    }

    if (query.recipient) {
      where.recipient = {
        contains: query.recipient,
      };
    }

    if (query.dateFrom || query.dateTo) {
      where.timestamp = {};
      if (query.dateFrom) {
        where.timestamp.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.timestamp.lte = new Date(query.dateTo);
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          rule: {
            select: {
              id: true,
              name: true,
              triggerEvent: true,
            },
          },
        },
      }),
    ]);

    const formattedItems = items.map((log) => ({
      ...log,
      payload: typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
