import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';
import { IsOptional, IsEnum, IsDate, IsString, ValidateIf } from 'class-validator';
import { Type as TransformType } from 'class-transformer';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @IsOptional()
  @IsEnum(['Completed', 'Migrated', 'Expelled', 'Withdrawn', 'None'], {
    message: 'Exit status must be one of: Completed, Migrated, Expelled, Withdrawn, None'
  })
  exitStatus?: string;

  @IsOptional()
  @TransformType(() => Date)
  @IsDate({ message: 'Invalid date format for exit date' })
  exitDate?: Date;

  @IsOptional()
  @IsString({ message: 'Exit remarks must be a string' })
  exitRemarks?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive', 'Graduated', 'Expelled', 'Withdrawn'], {
    message: 'Status must be one of: Active, Inactive, Graduated, Expelled, Withdrawn'
  })
  status?: string;

  @ValidateIf(o => o.exitStatus && o.exitStatus !== 'None')
  @IsDate({ message: 'Exit date is required when exit status is provided' })
  @TransformType(() => Date)
  validateExitDate?: Date;
}
