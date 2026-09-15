import { IsArray, ArrayMaxSize, ArrayUnique } from "class-validator";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from "class-validator";

export class CreateTicketDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  seatLabels?: string[];

  @IsOptional()
  @IsString()
  ticketTypeId?: string;
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  buyerName: string;

  @IsEmail()
  buyerEmail: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  quantity?: number;

  @IsOptional()
  @IsString()
  mobileMoneyNumber?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  confirmAdditional?: boolean;
}
