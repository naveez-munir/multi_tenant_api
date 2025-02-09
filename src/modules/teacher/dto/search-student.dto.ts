import { IsOptional, IsString, IsMongoId, IsEnum } from 'class-validator';

export class SearchTeacherDto {
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
  @IsEnum(['Male', 'Female'])
  gender?: string;

  @IsOptional()
  @IsEnum(['Active', 'OnLeave', 'Resigned', 'Terminated'])
  employmentStatus?: string;

  @IsOptional()
  @IsMongoId()
  classTeacherOf?: string;

  @IsOptional()
  @IsString()
  qualification?: string;
}

