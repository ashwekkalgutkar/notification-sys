import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RulesModule } from './rules/rules.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [
    PrismaModule,
    ChannelsModule,
    RulesModule,
    EventsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
