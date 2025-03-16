import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';

export class SearchStudentDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'CNIC number must be a string' })
  @Matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, { 
    message: 'CNIC must be in format: 00000-0000000-0' 
  })
  cniNumber?: string;

  @IsOptional()
  @IsString({ message: 'Guardian CNIC must be a string' })
  @Matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, { 
    message: 'Guardian CNIC must be in format: 00000-0000000-0' 
  })
  guardianCnic?: string;

  @IsOptional()
  @IsString({ message: 'Grade level must be a string' })
  gradeLevel?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive', 'Graduated', 'Expelled', 'Withdrawn'], { 
    message: 'Status must be one of: Active, Inactive, Graduated, Expelled, Withdrawn' 
  })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Section must be a string' })
  section?: string;
}
