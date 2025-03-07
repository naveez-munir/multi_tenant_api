import { IsNotEmpty, IsString, IsDate, IsMongoId, IsOptional, IsEnum, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { SubjectScheduleDto } from './subject-schedule.dto';

export class CreateExamDto {
  @IsNotEmpty()
  @IsMongoId()
  examType: string;

  @IsNotEmpty()
  @IsString()
  academicYear: string;

  @IsNotEmpty()
  @IsMongoId()
  classId: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['Scheduled', 'Ongoing', 'Completed', 'ResultDeclared'])
  status?: string;

  @ValidateNested({ each: true })
  @Type(() => SubjectScheduleDto)
  @ArrayMinSize(1)
  subjects: SubjectScheduleDto[];
}
