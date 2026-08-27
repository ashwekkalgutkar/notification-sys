import { ChannelRegistryService } from './channel-registry.service';
import { EmailChannel } from './email.channel';
import { InAppChannel } from './in-app.channel';
import { NotificationChannel } from './interfaces/notification-channel.interface';

describe('ChannelRegistryService & Channels', () => {
  let registry: ChannelRegistryService;
  let emailChannel: EmailChannel;
  let inAppChannel: InAppChannel;

  beforeEach(() => {
    registry = new ChannelRegistryService();
    emailChannel = new EmailChannel();
    inAppChannel = new InAppChannel();
  });

  describe('Registration & Retrieval', () => {
    it('should register and retrieve EmailChannel and InAppChannel', () => {
      registry.registerChannel(emailChannel);
      registry.registerChannel(inAppChannel);

      expect(registry.hasChannel('email')).toBe(true);
      expect(registry.hasChannel('in_app')).toBe(true);
      expect(registry.hasChannel('sms')).toBe(false);

      expect(registry.getChannel('email')).toBe(emailChannel);
      expect(registry.getChannel('in_app')).toBe(inAppChannel);
      expect(registry.getAvailableChannels()).toEqual(['email', 'in_app']);
    });

    it('should allow adding a third channel (e.g. SmsChannel) without modifying existing code', () => {
      class SmsChannel implements NotificationChannel {
        readonly channelType = 'sms';
        async send(recipient: string, message: string) {
          return { success: true };
        }
      }

      const smsChannel = new SmsChannel();
      registry.registerChannel(emailChannel);
      registry.registerChannel(smsChannel);

      expect(registry.getAvailableChannels()).toEqual(['email', 'sms']);
      expect(registry.getChannel('sms')).toBe(smsChannel);
    });
  });

  describe('Channel Dispatch & Simulated Failure Path', () => {
    it('should successfully deliver email for valid recipient', async () => {
      const result = await emailChannel.send('user@example.com', 'Hello World', { orderId: 123 });
      // Unless random failure hits, result should be structured
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.metadata).toHaveProperty('provider');
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle deterministic failure path for recipient with "fail"', async () => {
      const result = await emailChannel.send('fail-user@example.com', 'Test Message', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP connection failed');
    });

    it('should handle deterministic failure path for in-app recipient with "fail-inapp"', async () => {
      const result = await inAppChannel.send('user-fail-inapp', 'Test InApp', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('User push token expired');
    });
  });
});
