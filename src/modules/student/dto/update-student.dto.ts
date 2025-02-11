import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';
import { IsOptional, IsEnum, IsDate, IsString, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @IsOptional()
  @IsEnum(['Completed', 'Migrated', 'Expelled', 'Withdrawn', 'None'])
  exitStatus?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  exitDate?: Date;

  @IsOptional()
  @IsString()
  exitRemarks?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive', 'Graduated', 'Expelled', 'Withdrawn'])
  status?: string;
}
