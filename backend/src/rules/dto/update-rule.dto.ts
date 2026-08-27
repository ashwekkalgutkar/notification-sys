import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConditionItemDto } from './condition-item.dto';

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  triggerEvent?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionItemDto)
  conditions?: ConditionItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  recipients?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  channels?: string[];

  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
