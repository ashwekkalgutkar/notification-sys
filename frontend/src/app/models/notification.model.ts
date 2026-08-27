export type NotificationStatus = 'sent' | 'failed' | 'skipped';

export interface NotificationLog {
  id: string;
  ruleId: string;
  recipient: string;
  channel: string;
  status: NotificationStatus;
  payload: Record<string, any>;
  reason?: string | null;
  eventId: string;
  timestamp: string;
  rule?: {
    id: string;
    name: string;
    triggerEvent: string;
  };
}

export interface NotificationQueryFilter {
  page?: number;
  limit?: number;
  status?: string;
  channel?: string;
  recipient?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
