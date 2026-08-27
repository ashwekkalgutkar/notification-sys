import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { ChannelRegistryService } from '../channels/channel-registry.service';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelRegistry: ChannelRegistryService,
  ) {}

  async create(dto: CreateRuleDto) {
    this.validateChannels(dto.channels);

    const rule = await this.prisma.notificationRule.create({
      data: {
        name: dto.name,
        triggerEvent: dto.triggerEvent,
        conditions: JSON.stringify(dto.conditions || []),
        recipients: JSON.stringify(dto.recipients || []),
        channels: JSON.stringify(dto.channels || []),
        messageTemplate: dto.messageTemplate,
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
      },
    });

    return this.formatRule(rule);
  }

  async findAll(isEnabled?: boolean) {
    const where: any = {};
    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    const rules = await this.prisma.notificationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return rules.map((r) => this.formatRule(r));
  }

  async findOne(id: string) {
    const rule = await this.prisma.notificationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`NotificationRule with ID '${id}' not found`);
    }

    return this.formatRule(rule);
  }

  async update(id: string, dto: UpdateRuleDto) {
    await this.findOne(id); // Ensures existence

    if (dto.channels) {
      this.validateChannels(dto.channels);
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.triggerEvent !== undefined) updateData.triggerEvent = dto.triggerEvent;
    if (dto.conditions !== undefined) updateData.conditions = JSON.stringify(dto.conditions);
    if (dto.recipients !== undefined) updateData.recipients = JSON.stringify(dto.recipients);
    if (dto.channels !== undefined) updateData.channels = JSON.stringify(dto.channels);
    if (dto.messageTemplate !== undefined) updateData.messageTemplate = dto.messageTemplate;
    if (dto.isEnabled !== undefined) updateData.isEnabled = dto.isEnabled;

    const updated = await this.prisma.notificationRule.update({
      where: { id },
      data: updateData,
    });

    return this.formatRule(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.notificationRule.delete({ where: { id } });
    return { message: `Rule '${id}' successfully deleted` };
  }

  private validateChannels(channels: string[]) {
    if (!channels || channels.length === 0) {
      throw new BadRequestException('Recipients and channels arrays cannot be empty');
    }

    for (const channelType of channels) {
      if (!this.channelRegistry.hasChannel(channelType)) {
        const available = this.channelRegistry.getAvailableChannels().join(', ');
        throw new BadRequestException(
          `Invalid channel '${channelType}'. Registered channels are: [${available}]`,
        );
      }
    }
  }

  public formatRule(rule: any) {
    return {
      ...rule,
      conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions,
      recipients: typeof rule.recipients === 'string' ? JSON.parse(rule.recipients) : rule.recipients,
      channels: typeof rule.channels === 'string' ? JSON.parse(rule.channels) : rule.channels,
    };
  }
}
