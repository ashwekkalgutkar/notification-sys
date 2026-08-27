import { Controller, Post, Body } from '@nestjs/common';
import { EventsService } from './events.service';
import { TriggerEventDto } from './dto/trigger-event.dto';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  triggerEvent(@Body() triggerEventDto: TriggerEventDto) {
    return this.eventsService.processEvent(triggerEventDto);
  }
}
