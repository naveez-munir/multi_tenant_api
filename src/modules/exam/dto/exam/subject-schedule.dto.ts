// subject-schedule.dto.ts
import { IsNotEmpty, IsString, IsDate, IsNumber, IsMongoId, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectScheduleDto {
  @IsNotEmpty()
  @IsMongoId()
  subject: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  examDate: Date;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  maxMarks: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  passingMarks: number;
}
