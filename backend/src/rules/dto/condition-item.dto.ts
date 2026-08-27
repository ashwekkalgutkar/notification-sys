import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { Operator } from '../../common/interfaces/condition.interface';

const ALLOWED_OPERATORS: Operator[] = ['gt', 'lt', 'gte', 'lte', 'eq', 'neq', 'contains'];

export class ConditionItemDto {
  @IsString()
  @IsNotEmpty()
  field: string;

  @IsString()
  @IsIn(ALLOWED_OPERATORS, {
    message: `operator must be one of: ${ALLOWED_OPERATORS.join(', ')}`,
  })
  operator: string;

  @IsNotEmpty({ message: 'value is required for condition' })
  value: any;
}
