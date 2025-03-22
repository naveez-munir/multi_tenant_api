import { IsOptional, IsString, IsEnum, IsMongoId } from 'class-validator';
import { IsPakistaniCNIC } from 'src/common/dto/common-validations.dto';

export class SearchStudentDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'CNIC number must be a string' })
  @IsPakistaniCNIC()
  cniNumber?: string;

  @IsOptional()
  @IsString({ message: 'Guardian CNIC must be a string' })
  @IsPakistaniCNIC()
  guardianCnic?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid guardian ID format' })
  guardianId?: string;

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
