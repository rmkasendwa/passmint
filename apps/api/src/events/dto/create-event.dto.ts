import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsPositive, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @Type(() => Date)
  @IsDate()
  startsAt: Date;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  capacity: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents: number;
}
