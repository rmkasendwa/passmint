import { IsEmail, IsOptional, IsString } from "class-validator";

export class RecoverTicketsDto {
  @IsEmail()
  buyerEmail: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}
