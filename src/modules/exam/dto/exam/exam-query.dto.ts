import { IsOptional, IsString, IsEnum } from 'class-validator';

export class ExamQueryDto {
  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsEnum(['Scheduled', 'Ongoing', 'Completed', 'ResultDeclared'])
  status?: string;
}
