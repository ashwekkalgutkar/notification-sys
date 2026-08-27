import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [ChannelsModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
