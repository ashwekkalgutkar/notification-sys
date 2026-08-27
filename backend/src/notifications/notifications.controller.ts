import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.findAll(query);
  }
}
