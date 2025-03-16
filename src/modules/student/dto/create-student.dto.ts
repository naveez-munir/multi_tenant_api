import { Transform, Type } from 'class-transformer';
import { 
  IsNotEmpty, 
  IsString, 
  IsDate, 
  ValidateNested,
  IsOptional,
  IsMongoId,
  IsEnum,
  MinDate,
  MaxDate,
} from 'class-validator';
import { Types } from 'mongoose';
import { GuardianDto } from './guardian.dto';
import { BaseUserDto } from 'src/common/dto';

export class CreateStudentDto extends BaseUserDto {
  @IsNotEmpty({ message: 'Date of birth is required' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid date format for date of birth' })
  @MinDate(new Date(1900, 0, 1), { message: 'Date of birth must be after 1900' })
  @MaxDate(new Date(), { message: 'Date of birth cannot be in the future' })
  dateOfBirth: Date;

  @IsNotEmpty({ message: 'Guardian information is required' })
  @ValidateNested()
  @Type(() => GuardianDto)
  guardian: GuardianDto;

  @IsNotEmpty({ message: 'Grade level is required' })
  @IsString({ message: 'Grade level must be a string' })
  gradeLevel: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid class ID format' })
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(String(value)) : value))
  class?: Types.ObjectId;

  @IsOptional()
  @IsString({ message: 'Roll number must be a string' })
  rollNumber?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Enrollment date cannot be empty if provided' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid date format for enrollment date' })
  @MaxDate(new Date(), { message: 'Enrollment date cannot be in the future' })
  enrollmentDate: Date;

  @IsNotEmpty({ message: 'Admission date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid date format for admission date' })
  @MaxDate(new Date(), { message: 'Admission date cannot be in the future' })
  admissionDate: Date;
  
  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  @IsEnum(['Active', 'Inactive', 'Graduated', 'Expelled', 'Withdrawn'], { 
    message: 'Status must be one of: Active, Inactive, Graduated, Expelled, Withdrawn' 
  })
  status?: string;
}
