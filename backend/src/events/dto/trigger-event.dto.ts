import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class TriggerEventDto {
  @IsString()
  @IsNotEmpty({ message: 'eventType is required' })
  eventType: string;

  @IsObject({ message: 'payload must be a valid JSON object' })
  payload: Record<string, any>;

  @IsString()
  @IsNotEmpty({ message: 'eventId is required for deduplication' })
  eventId: string;
}
