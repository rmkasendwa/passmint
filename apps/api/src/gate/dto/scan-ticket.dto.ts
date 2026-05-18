import { IsNotEmpty, IsString } from 'class-validator';

export class ScanTicketDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
