import { IsOptional, Matches } from 'class-validator';

export class ScanMetricsQueryDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  day?: string;
}
