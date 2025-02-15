import { IsOptional, IsDateString } from 'class-validator';

export class DiaryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
