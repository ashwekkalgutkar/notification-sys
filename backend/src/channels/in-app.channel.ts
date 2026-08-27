import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  DeliveryResult,
} from './interfaces/notification-channel.interface';

@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly channelType = 'in_app';
  private readonly logger = new Logger(InAppChannel.name);

  async send(
    recipient: string,
    message: string,
    payload: Record<string, any>,
  ): Promise<DeliveryResult> {
    this.logger.log(`[InAppChannel] Dispatching in-app notification to user ${recipient}...`);

    // Deterministic failure for testing
    if (recipient.includes('fail-inapp')) {
      this.logger.warn(`[InAppChannel] Delivery failed for ${recipient}: User push token invalid`);
      return {
        success: false,
        error: 'User push token expired or invalid recipient ID',
      };
    }

    // ~10% simulated random failure
    const isRandomFailure = Math.random() < 0.1;
    if (isRandomFailure) {
      this.logger.warn(`[InAppChannel] Simulated 10% random in-app dispatch failure for ${recipient}`);
      return {
        success: false,
        error: 'Simulated WebSocket push timeout',
      };
    }

    this.logger.log(`[InAppChannel] In-app notification pushed successfully to ${recipient}`);
    return {
      success: true,
      metadata: {
        pushedAt: new Date().toISOString(),
        channel: 'WebSocket/Push',
        unreadCount: 1,
      },
    };
  }
}
