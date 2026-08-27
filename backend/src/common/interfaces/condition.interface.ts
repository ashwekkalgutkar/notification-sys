export type Operator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'contains';

export interface Condition {
  field: string;
  operator: Operator;
  value: any;
}
