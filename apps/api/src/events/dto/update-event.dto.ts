import { Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  IsIn,
} from "class-validator";

export class UpdateEventDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishAt?: Date | null;
  @IsOptional()
  @IsIn(["published"])
  status?: "published";
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mapLocation?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  capacity?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_500_000)
  thumbnailUrl?: string;
}
