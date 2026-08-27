import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConditionEvaluatorService } from '../common/services/condition-evaluator.service';
import { ChannelRegistryService } from '../channels/channel-registry.service';
import { TriggerEventDto } from './dto/trigger-event.dto';
import { Prisma } from '@prisma/client';

export interface DispatchSummary {
  ruleId: string;
  ruleName: string;
  recipient: string;
  channel: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  logId?: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
    private readonly channelRegistry: ChannelRegistryService,
  ) {}

  async processEvent(dto: TriggerEventDto) {
    this.logger.log(
      `Processing incoming event '${dto.eventType}' with eventId '${dto.eventId}'`,
    );

    // 1. Find all enabled rules matching eventType
    const rules = await this.prisma.notificationRule.findMany({
      where: {
        triggerEvent: dto.eventType,
        isEnabled: true,
      },
    });

    this.logger.log(
      `Found ${rules.length} enabled rule(s) matching eventType '${dto.eventType}'`,
    );

    const summaries: DispatchSummary[] = [];

    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions || '[]');
      const recipients: string[] = JSON.parse(rule.recipients || '[]');
      const channels: string[] = JSON.parse(rule.channels || '[]');

      // 2. Evaluate conditions
      const matchesConditions = this.conditionEvaluator.evaluate(
        dto.payload,
        conditions,
      );

      if (!matchesConditions) {
        this.logger.log(
          `Rule '${rule.name}' (${rule.id}) condition evaluation failed. Skipping rule.`,
        );
        summaries.push({
          ruleId: rule.id,
          ruleName: rule.name,
          recipient: 'N/A',
          channel: 'N/A',
          status: 'skipped',
          reason: 'Payload did not satisfy rule conditions',
        });
        continue;
      }

      // 3. Interpolate message template
      const messageBody = this.interpolateTemplate(
        rule.messageTemplate,
        dto.payload,
      );

      // 4. Dispatch to each recipient and channel
      for (const recipient of recipients) {
        for (const channelType of channels) {
          const dispatchResult = await this.dispatchNotification({
            eventId: dto.eventId,
            rule,
            recipient,
            channelType,
            messageBody,
            payload: dto.payload,
          });

          summaries.push(dispatchResult);
        }
      }
    }

    return {
      eventId: dto.eventId,
      eventType: dto.eventType,
      matchedRulesCount: rules.length,
      dispatches: summaries,
    };
  }

  private async dispatchNotification(params: {
    eventId: string;
    rule: any;
    recipient: string;
    channelType: string;
    messageBody: string;
    payload: Record<string, any>;
  }): Promise<DispatchSummary> {
    const { eventId, rule, recipient, channelType, messageBody, payload } = params;

    // Check pre-existence to avoid unnecessary external channel calls
    const existingLog = await this.prisma.notificationLog.findUnique({
      where: {
        unique_event_dispatch: {
          eventId,
          ruleId: rule.id,
          recipient,
          channel: channelType,
        },
      },
    });

    if (existingLog) {
      this.logger.warn(
        `[DEDUPLICATION ALERT] Duplicate eventId '${eventId}' detected for rule '${rule.id}', recipient '${recipient}', channel '${channelType}'. DB unique constraint enforced.`,
      );
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        recipient,
        channel: channelType,
        status: 'skipped',
        reason: 'Duplicate eventId (deduplicated at database constraint level)',
        logId: existingLog.id,
      };
    }

    // Retrieve channel from Registry
    const channelInstance = this.channelRegistry.getChannel(channelType);
    if (!channelInstance) {
      const errorMsg = `Channel '${channelType}' is not registered in ChannelRegistryService`;
      this.logger.error(errorMsg);

      const log = await this.createLogRecord({
        ruleId: rule.id,
        recipient,
        channel: channelType,
        status: 'failed',
        reason: errorMsg,
        payload,
        eventId,
      });

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        recipient,
        channel: channelType,
        status: 'failed',
        reason: errorMsg,
        logId: log.id,
      };
    }

    // Execute Channel Delivery with error isolation
    let status: 'sent' | 'failed' = 'sent';
    let errorReason: string | undefined = undefined;

    try {
      const deliveryResult = await channelInstance.send(
        recipient,
        messageBody,
        payload,
      );

      if (!deliveryResult.success) {
        status = 'failed';
        errorReason = deliveryResult.error || 'Channel delivery returned failure';
      }
    } catch (err: any) {
      status = 'failed';
      errorReason = err.message || 'Unhandled exception in channel send execution';
      this.logger.error(
        `Channel '${channelType}' threw unhandled error during send: ${errorReason}`,
      );
    }

    // Persist Log with Database Unique Constraint protection
    try {
      const log = await this.prisma.notificationLog.create({
        data: {
          ruleId: rule.id,
          recipient,
          channel: channelType,
          status,
          payload: JSON.stringify(payload),
          reason: errorReason || null,
          eventId,
        },
      });

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        recipient,
        channel: channelType,
        status,
        reason: errorReason,
        logId: log.id,
      };
    } catch (err: any) {
      // Catch DB Unique constraint violation if concurrent request inserted simultaneously
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.warn(
          `[DEDUPLICATION DB LOCK] Unique constraint P2002 triggered for eventId '${eventId}'`,
        );
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          recipient,
          channel: channelType,
          status: 'skipped',
          reason: 'Duplicate eventId (caught by SQLite unique index constraint)',
        };
      }
      throw err;
    }
  }

  private async createLogRecord(params: {
    ruleId: string;
    recipient: string;
    channel: string;
    status: string;
    reason?: string;
    payload: Record<string, any>;
    eventId: string;
  }) {
    return this.prisma.notificationLog.create({
      data: {
        ruleId: params.ruleId,
        recipient: params.recipient,
        channel: params.channel,
        status: params.status,
        reason: params.reason || null,
        payload: JSON.stringify(params.payload),
        eventId: params.eventId,
      },
    });
  }

  public interpolateTemplate(template: string, payload: Record<string, any>): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
      const val = this.conditionEvaluator.getNestedValue(payload, path);
      return val !== undefined && val !== null ? String(val) : match;
    });
  }
}
