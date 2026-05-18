import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, Max } from 'class-validator';

export class CreateTicketDto {
  @IsUUID()
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
}
