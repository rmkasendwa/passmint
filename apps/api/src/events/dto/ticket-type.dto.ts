import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class TicketTypeDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;
  @Type(() => Number) @IsInt() @Min(0)
  priceCents: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  capacity?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  maxPerOrder?: number;
  @IsOptional() @Type(() => Date) @IsDate()
  salesStart?: Date | null;
  @IsOptional() @Type(() => Date) @IsDate()
  salesEnd?: Date | null;
}
