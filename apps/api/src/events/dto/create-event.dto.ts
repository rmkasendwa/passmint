import { IsObject, IsArray, ArrayMaxSize, ValidateNested } from "class-validator";
import { TicketTypeDto } from "./ticket-type.dto";
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
  @IsOptional()
  @IsObject()
  booking?: Record<string, any> | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TicketTypeDto)
  ticketTypes?: TicketTypeDto[];

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
