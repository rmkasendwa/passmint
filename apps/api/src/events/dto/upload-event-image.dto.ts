import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadEventImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  contentType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(7_000_000)
  dataUrl: string;
}
