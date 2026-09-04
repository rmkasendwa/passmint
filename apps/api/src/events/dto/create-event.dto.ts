import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mapLocation?: string;

  @Type(() => Date)
  @IsDate()
  startsAt: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  capacity?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_500_000)
  thumbnailUrl?: string;
}
