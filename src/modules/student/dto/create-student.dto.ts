import { Transform, Type } from 'class-transformer';
import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsEmail, 
  IsOptional, 
  IsDate, 
  ValidateNested,
  IsUrl,
  IsPhoneNumber,
  IsMongoId
} from 'class-validator';
import { Types } from 'mongoose';
import { GuardianDto } from './guardian.dto';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  cniNumber: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @IsNotEmpty()
  @IsEnum(['Male', 'Female'])
  gender: string;

  @IsOptional()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
  bloodGroup?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => GuardianDto)
  guardian: GuardianDto;

  @IsNotEmpty()
  @IsString()
  gradeLevel: string;

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(String(value)) : value))
  section?: Types.ObjectId;



  @IsOptional()
  @IsString()
  rollNumber?: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  enrollmentDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  admissionDate: Date;
}
