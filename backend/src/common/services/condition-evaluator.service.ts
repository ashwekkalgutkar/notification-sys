import { Injectable } from '@nestjs/common';
import { Condition, Operator } from '../interfaces/condition.interface';

@Injectable()
export class ConditionEvaluatorService {
  /**
   * Evaluates an array of conditions against an incoming event payload using AND logic.
   * Returns true if all conditions pass (or if conditions array is empty).
   */
  evaluate(payload: Record<string, any>, conditions: Condition[]): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    for (const condition of conditions) {
      const isMet = this.evaluateSingleCondition(payload, condition);
      if (!isMet) {
        return false; // AND logic: fail fast
      }
    }

    return true;
  }

  /**
   * Evaluates a single condition against the payload.
   */
  public evaluateSingleCondition(payload: Record<string, any>, condition: Condition): boolean {
    if (!condition || !condition.field) {
      return false;
    }

    const actualValue = this.getNestedValue(payload, condition.field);
    const expectedValue = condition.value;

    // Handling missing field case
    if (actualValue === undefined || actualValue === null) {
      if (condition.operator === 'neq') {
        return expectedValue !== undefined && expectedValue !== null;
      }
      return false;
    }

    switch (condition.operator) {
      case 'eq':
        return this.compareEquals(actualValue, expectedValue);

      case 'neq':
        return !this.compareEquals(actualValue, expectedValue);

      case 'gt': {
        const [a, b] = this.toNumericValues(actualValue, expectedValue);
        if (a === null || b === null) return false;
        return a > b;
      }

      case 'gte': {
        const [a, b] = this.toNumericValues(actualValue, expectedValue);
        if (a === null || b === null) return false;
        return a >= b;
      }

      case 'lt': {
        const [a, b] = this.toNumericValues(actualValue, expectedValue);
        if (a === null || b === null) return false;
        return a < b;
      }

      case 'lte': {
        const [a, b] = this.toNumericValues(actualValue, expectedValue);
        if (a === null || b === null) return false;
        return a <= b;
      }

      case 'contains':
        return this.compareContains(actualValue, expectedValue);

      default:
        return false;
    }
  }

  /**
   * Safely retrieves nested values from an object using dot notation (e.g., "user.profile.age").
   */
  public getNestedValue(obj: Record<string, any>, path: string): any {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  private compareEquals(actual: any, expected: any): boolean {
    if (actual === expected) return true;
    
    // Coerce numeric strings for comparison if applicable
    if (typeof actual === 'string' && typeof expected === 'number') {
      const parsed = Number(actual);
      return !isNaN(parsed) && parsed === expected;
    }
    if (typeof actual === 'number' && typeof expected === 'string') {
      const parsed = Number(expected);
      return !isNaN(parsed) && actual === parsed;
    }

    // Loose comparison for boolean string representation
    if (typeof actual === 'boolean' && typeof expected === 'string') {
      return String(actual).toLowerCase() === expected.toLowerCase();
    }

    return String(actual) === String(expected);
  }

  private compareContains(actual: any, expected: any): boolean {
    if (Array.isArray(actual)) {
      return actual.some((item) => this.compareEquals(item, expected));
    }

    if (typeof actual === 'string') {
      const searchStr = String(expected).toLowerCase();
      return actual.toLowerCase().includes(searchStr);
    }

    return false;
  }

  private toNumericValues(actual: any, expected: any): [number | null, number | null] {
    const numActual = Number(actual);
    const numExpected = Number(expected);

    if (isNaN(numActual) || isNaN(numExpected)) {
      return [null, null];
    }

    return [numActual, numExpected];
  }
}
