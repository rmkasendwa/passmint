import { Type } from 'class-transformer';
import { IsDate, MinDate } from 'class-validator';

export class DuplicateEventDto {
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(), { message: 'Choose a future date for the new event.' })
  startsAt: Date;
}
