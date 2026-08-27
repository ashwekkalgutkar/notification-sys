import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  DeliveryResult,
} from './interfaces/notification-channel.interface';

@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly channelType = 'email';
  private readonly logger = new Logger(EmailChannel.name);

  async send(
    recipient: string,
    message: string,
    payload: Record<string, any>,
  ): Promise<DeliveryResult> {
    this.logger.log(`[EmailChannel] Preparing to send email to ${recipient}...`);

    // Deterministic failure for testing
    if (recipient.includes('fail') || recipient.includes('error')) {
      this.logger.warn(`[EmailChannel] Delivery failed for ${recipient}: SMTP connection reset`);
      return {
        success: false,
        error: 'SMTP connection failed or recipient rejected',
      };
    }

    // ~10% simulated random failure path requirement
    const isRandomFailure = Math.random() < 0.1;
    if (isRandomFailure) {
      this.logger.warn(`[EmailChannel] Simulated 10% random delivery failure for ${recipient}`);
      return {
        success: false,
        error: 'Simulated email provider 500 internal server error',
      };
    }

    this.logger.log(`[EmailChannel] Email successfully sent to ${recipient}`);
    return {
      success: true,
      metadata: {
        sentAt: new Date().toISOString(),
        provider: 'MockEmailProvider (SMTP)',
        messageLength: message.length,
      },
    };
  }
}
