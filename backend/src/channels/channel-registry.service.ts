import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from './interfaces/notification-channel.interface';

@Injectable()
export class ChannelRegistryService {
  private readonly logger = new Logger(ChannelRegistryService.name);
  private readonly channels = new Map<string, NotificationChannel>();

  /**
   * Registers a new notification channel.
   * To extend the system with a 3rd or 4th channel (e.g., SMS, Webhook),
   * simply implement NotificationChannel and register it here!
   */
  registerChannel(channel: NotificationChannel): void {
    if (this.channels.has(channel.channelType)) {
      this.logger.warn(
        `Channel with type '${channel.channelType}' is already registered. Overwriting registration.`,
      );
    }
    this.channels.set(channel.channelType, channel);
    this.logger.log(`Registered notification channel: '${channel.channelType}'`);
  }

  /**
   * Retrieves a registered channel by its type key (e.g. 'email', 'in_app').
   */
  getChannel(type: string): NotificationChannel | undefined {
    return this.channels.get(type);
  }

  /**
   * Checks if a channel type is registered.
   */
  hasChannel(type: string): boolean {
    return this.channels.has(type);
  }

  /**
   * Returns a list of all registered channel type keys.
   */
  getAvailableChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}
