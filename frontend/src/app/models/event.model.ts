export interface TriggerEventRequest {
  eventType: string;
  payload: Record<string, any>;
  eventId: string;
}

export interface DispatchSummary {
  ruleId: string;
  ruleName: string;
  recipient: string;
  channel: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  logId?: string;
}

export interface TriggerEventResponse {
  eventId: string;
  eventType: string;
  matchedRulesCount: number;
  dispatches: DispatchSummary[];
}
