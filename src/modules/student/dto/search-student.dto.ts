import { IsOptional, IsString, IsEnum } from 'class-validator';

export class SearchStudentDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  cniNumber?: string;

  @IsOptional()
  @IsString()
  guardianCnic?: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive', 'Graduated', 'Expelled', 'Withdrawn'])
  status?: string;

  @IsOptional()
  @IsString()
  section?: string;
}
