import { IsOptional, IsMongoId, IsString } from 'class-validator';

export class ExamResultQueryDto {
  @IsMongoId()
  @IsOptional()
  examId?: string;

  @IsMongoId()
  @IsOptional()
  studentId?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsMongoId()
  @IsOptional()
  examType?: string;
}
