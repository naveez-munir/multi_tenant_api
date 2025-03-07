import { IsNotEmpty, IsMongoId, IsArray, ValidateNested, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class SubjectResultDto {
  @IsMongoId()
  @IsNotEmpty()
  subject: string;

  @IsNumber()
  @IsNotEmpty()
  marksObtained: number;

  @IsNumber()
  @IsNotEmpty()
  maxMarks: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
export class CreateExamResultDto {
  @IsMongoId()
  @IsNotEmpty()
  examId: string;

  @IsMongoId()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectResultDto)
  subjectResults: SubjectResultDto[];

  @IsString()
  @IsOptional()
  remarks?: string;
}
