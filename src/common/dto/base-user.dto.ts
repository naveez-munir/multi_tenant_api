import { IsNotEmpty, IsOptional, IsString, IsEmail, IsEnum, IsUrl, Matches } from 'class-validator';
import { BaseEntityDto } from './base-entity.dto';

export class BaseUserDto extends BaseEntityDto {
  @IsNotEmpty({ message: 'CNIC number is required' })
  @IsString({ message: 'CNIC number must be a string' })
  @Matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, { 
    message: 'CNIC must be in format: 00000-0000000-0' 
  })
  cniNumber: string;

  @IsNotEmpty({ message: 'Gender is required' })
  @IsEnum(['Male', 'Female'], { 
    message: 'Gender must be either Male or Female' 
  })
  gender: string;

  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], {
    message: 'Blood group must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-'
  })
  bloodGroup?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Photo URL must be a valid URL' })
  photoUrl?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(\+92|0)[0-9]{10}$/, { 
    message: 'Phone must be a valid Pakistan number (e.g., +923001234567 or 03001234567)' 
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;
}
