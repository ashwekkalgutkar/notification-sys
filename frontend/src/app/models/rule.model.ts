export type Operator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'contains';

export interface Condition {
  field: string;
  operator: Operator;
  value: any;
}

export interface NotificationRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditions: Condition[];
  recipients: string[];
  channels: string[];
  messageTemplate: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleRequest {
  name: string;
  triggerEvent: string;
  conditions: Condition[];
  recipients: string[];
  channels: string[];
  messageTemplate: string;
  isEnabled?: boolean;
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {}
