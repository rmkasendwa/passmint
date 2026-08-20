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
  @Max(10)
  quantity?: number;

  @IsOptional()
  @IsString()
  mobileMoneyNumber?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  confirmAdditional?: boolean;
}
