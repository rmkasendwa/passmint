import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class TicketActivityQueryDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000)
  page = 1;
}
