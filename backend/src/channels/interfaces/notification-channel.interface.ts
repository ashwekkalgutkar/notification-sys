export interface DeliveryResult {
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface NotificationChannel {
  /**
   * Unique identifier for the channel (e.g., 'email', 'in_app', 'sms')
   */
  readonly channelType: string;

  /**
   * Dispatches a notification to the specified recipient.
   */
  send(
    recipient: string,
    message: string,
    payload: Record<string, any>,
  ): Promise<DeliveryResult>;
}
