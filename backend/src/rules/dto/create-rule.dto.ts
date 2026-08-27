import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConditionItemDto } from './condition-item.dto';

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  triggerEvent: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionItemDto)
  conditions: ConditionItemDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'recipients array must contain at least one recipient' })
  @IsString({ each: true, message: 'each recipient must be a string' })
  recipients: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'channels array must contain at least one channel' })
  @IsString({ each: true, message: 'each channel must be a string' })
  channels: string[];

  @IsString()
  @IsNotEmpty()
  messageTemplate: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
