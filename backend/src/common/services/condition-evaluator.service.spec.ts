import { ConditionEvaluatorService } from './condition-evaluator.service';
import { Condition } from '../interfaces/condition.interface';

describe('ConditionEvaluatorService', () => {
  let evaluator: ConditionEvaluatorService;

  beforeEach(() => {
    evaluator = new ConditionEvaluatorService();
  });

  describe('Empty & Edge Cases', () => {
    it('should return true for an empty conditions array', () => {
      const payload = { orderValue: 5000 };
      expect(evaluator.evaluate(payload, [])).toBe(true);
    });

    it('should return true if conditions array is undefined/null', () => {
      const payload = { orderValue: 5000 };
      expect(evaluator.evaluate(payload, null as any)).toBe(true);
    });

    it('should return false if target field is missing from payload (except neq)', () => {
      const payload = { user: 'Alice' };
      const condition: Condition = { field: 'orderValue', operator: 'gt', value: 100 };
      expect(evaluator.evaluate(payload, [condition])).toBe(false);
    });

    it('should return true for neq operator when target field is missing from payload', () => {
      const payload = { user: 'Alice' };
      const condition: Condition = { field: 'orderValue', operator: 'neq', value: 100 };
      expect(evaluator.evaluate(payload, [condition])).toBe(true);
    });
  });

  describe('Operator: eq', () => {
    it('should evaluate exact matches correctly', () => {
      const payload = { status: 'PENDING' };
      const condition: Condition = { field: 'status', operator: 'eq', value: 'PENDING' };
      expect(evaluator.evaluate(payload, [condition])).toBe(true);
    });

    it('should handle numeric string coercion in eq comparison', () => {
      const payload = { amount: '500' };
      const condition: Condition = { field: 'amount', operator: 'eq', value: 500 };
      expect(evaluator.evaluate(payload, [condition])).toBe(true);
    });

    it('should return false when values do not match', () => {
      const payload = { status: 'COMPLETED' };
      const condition: Condition = { field: 'status', operator: 'eq', value: 'PENDING' };
      expect(evaluator.evaluate(payload, [condition])).toBe(false);
    });
  });

  describe('Operator: neq', () => {
    it('should return true when values are not equal', () => {
      const payload = { status: 'SHIPPED' };
      const condition: Condition = { field: 'status', operator: 'neq', value: 'CANCELLED' };
      expect(evaluator.evaluate(payload, [condition])).toBe(true);
    });

    it('should return false when values are equal', () => {
      const payload = { status: 'SHIPPED' };
      const condition: Condition = { field: 'status', operator: 'neq', value: 'SHIPPED' };
      expect(evaluator.evaluate(payload, [condition])).toBe(false);
    });
  });

  describe('Operator: gt & gte', () => {
    it('should evaluate gt correctly', () => {
      const payload = { orderValue: 15000 };
      const conditionGt: Condition = { field: 'orderValue', operator: 'gt', value: 10000 };
      const conditionFail: Condition = { field: 'orderValue', operator: 'gt', value: 15000 };

      expect(evaluator.evaluate(payload, [conditionGt])).toBe(true);
      expect(evaluator.evaluate(payload, [conditionFail])).toBe(false);
    });

    it('should evaluate gte correctly', () => {
      const payload = { orderValue: 10000 };
      const conditionGte: Condition = { field: 'orderValue', operator: 'gte', value: 10000 };
      expect(evaluator.evaluate(payload, [conditionGte])).toBe(true);
    });

    it('should handle numeric string in gt evaluation', () => {
      const payload = { price: '250.50' };
      const condition: Condition = { field: 'price', operator: 'gt', value: 200 };
      expect(evaluator.evaluate(payload, [condition])).toBe(true);
    });

    it('should return false if value cannot be coerced to a number for gt', () => {
      const payload = { price: 'not-a-number' };
      const condition: Condition = { field: 'price', operator: 'gt', value: 100 };
      expect(evaluator.evaluate(payload, [condition])).toBe(false);
    });
  });

  describe('Operator: lt & lte', () => {
    it('should evaluate lt correctly', () => {
      const payload = { itemStock: 5 };
      const conditionLt: Condition = { field: 'itemStock', operator: 'lt', value: 10 };
      const conditionFail: Condition = { field: 'itemStock', operator: 'lt', value: 5 };

      expect(evaluator.evaluate(payload, [conditionLt])).toBe(true);
      expect(evaluator.evaluate(payload, [conditionFail])).toBe(false);
    });

    it('should evaluate lte correctly', () => {
      const payload = { itemStock: 5 };
      const conditionLte: Condition = { field: 'itemStock', operator: 'lte', value: 5 };
      expect(evaluator.evaluate(payload, [conditionLte])).toBe(true);
    });
  });

  describe('Operator: contains', () => {
    it('should check substring containment in strings (case insensitive)', () => {
      const payload = { message: 'Order created for VIP Customer' };
      const condition: Condition = { field: 'message', operator: 'contains', value: 'vip' };
      expect(evaluator.evaluate(payload, [condition])).toBe(true);
    });

    it('should check array item containment', () => {
      const payload = { tags: ['urgent', 'premium', 'express'] };
      const condition: Condition = { field: 'tags', operator: 'contains', value: 'premium' };
      expect(evaluator.evaluate(payload, [condition])).toBe(false || true);
      expect(evaluator.evaluate(payload, [condition])).toBe(true);
    });

    it('should return false if substring is not contained', () => {
      const payload = { message: 'Standard delivery' };
      const condition: Condition = { field: 'message', operator: 'contains', value: 'express' };
      expect(evaluator.evaluate(payload, [condition])).toBe(false);
    });
  });

  describe('Nested Field Access (Dot Notation)', () => {
    it('should resolve nested fields like user.profile.tier', () => {
      const payload = {
        user: {
          profile: {
            tier: 'PLATINUM',
            score: 95,
          },
        },
      };

      const condition1: Condition = { field: 'user.profile.tier', operator: 'eq', value: 'PLATINUM' };
      const condition2: Condition = { field: 'user.profile.score', operator: 'gte', value: 90 };

      expect(evaluator.evaluate(payload, [condition1, condition2])).toBe(true);
    });

    it('should return false gracefully if intermediate nested key does not exist', () => {
      const payload = { user: {} };
      const condition: Condition = { field: 'user.profile.tier', operator: 'eq', value: 'GOLD' };
      expect(evaluator.evaluate(payload, [condition])).toBe(false);
    });
  });

  describe('AND Logic combining multiple conditions', () => {
    it('should return true only when ALL conditions are met', () => {
      const payload = {
        orderValue: 12000,
        country: 'US',
        customer: { tier: 'GOLD' },
      };

      const conditions: Condition[] = [
        { field: 'orderValue', operator: 'gte', value: 10000 },
        { field: 'country', operator: 'eq', value: 'US' },
        { field: 'customer.tier', operator: 'eq', value: 'GOLD' },
      ];

      expect(evaluator.evaluate(payload, conditions)).toBe(true);
    });

    it('should return false if even one condition fails', () => {
      const payload = {
        orderValue: 12000,
        country: 'CA', // CA does not match US
        customer: { tier: 'GOLD' },
      };

      const conditions: Condition[] = [
        { field: 'orderValue', operator: 'gte', value: 10000 },
        { field: 'country', operator: 'eq', value: 'US' },
        { field: 'customer.tier', operator: 'eq', value: 'GOLD' },
      ];

      expect(evaluator.evaluate(payload, conditions)).toBe(false);
    });
  });
});
