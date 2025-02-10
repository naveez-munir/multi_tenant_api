import { IsNotEmpty, IsOptional, IsString, IsEmail, IsEnum, IsDate, IsMongoId, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateTeacherDto {
  @IsNotEmpty()
  @IsString()
  cniNumber: string;

  @IsNotEmpty()
  @IsEnum(['Male', 'Female'])
  gender: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
  bloodGroup?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  joiningDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  leavingDate?: Date;

  @IsNotEmpty()
  @IsEnum(['Active', 'OnLeave', 'Resigned', 'Terminated'])
  employmentStatus: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsMongoId()
  classTeacherOf?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationHistoryDto)
  educationHistory?: EducationHistoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents?: DocumentDto[];

  @IsOptional()
  @IsMongoId()
  userId?: Types.ObjectId;
}

// Education History DTO
export class EducationHistoryDto {
  @IsNotEmpty()
  @IsString()
  degree: string;

  @IsNotEmpty()
  @IsString()
  institution: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  year: number;

  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}

// Experience DTO
export class ExperienceDto {
  @IsNotEmpty()
  @IsString()
  institution: string;

  @IsNotEmpty()
  @IsString()
  position: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  fromDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  experienceLatterUrl?: string;
}

// Documents DTO
export class DocumentDto {
  @IsNotEmpty()
  @IsString()
  documentType: string;

  @IsNotEmpty()
  @IsUrl()
  documentUrl: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  uploadDate?: Date;
}

