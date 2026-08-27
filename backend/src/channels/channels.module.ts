import { Module, OnModuleInit } from '@nestjs/common';
import { ChannelRegistryService } from './channel-registry.service';
import { EmailChannel } from './email.channel';
import { InAppChannel } from './in-app.channel';

@Module({
  providers: [ChannelRegistryService, EmailChannel, InAppChannel],
  exports: [ChannelRegistryService, EmailChannel, InAppChannel],
})
export class ChannelsModule implements OnModuleInit {
  constructor(
    private readonly registry: ChannelRegistryService,
    private readonly emailChannel: EmailChannel,
    private readonly inAppChannel: InAppChannel,
  ) {}

  onModuleInit() {
    this.registry.registerChannel(this.emailChannel);
    this.registry.registerChannel(this.inAppChannel);
  }
}
