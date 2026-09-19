import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class ImportEventsDto {
  @IsObject()
  archive: Record<string, unknown>;

  @ValidateIf((_, value) => value !== undefined)
  @IsObject()
  thumbnailOverrides?: Record<string, unknown>;

  @IsBoolean()
  dryRun: boolean = true;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  targetOwnerId?: string;

  @IsIn(["skip", "error"])
  onDuplicate: "skip" | "error" = "skip";
}
