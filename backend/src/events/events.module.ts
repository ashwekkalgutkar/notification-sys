import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ConditionEvaluatorService } from '../common/services/condition-evaluator.service';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [ChannelsModule],
  controllers: [EventsController],
  providers: [EventsService, ConditionEvaluatorService],
  exports: [EventsService],
})
export class EventsModule {}
