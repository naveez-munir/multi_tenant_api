import { IsNotEmpty, IsString, IsEnum, IsEmail, IsOptional, Matches } from 'class-validator';

export class GuardianDto {
  @IsNotEmpty({ message: 'Guardian name is required' })
  @IsString({ message: 'Guardian name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'CNIC number is required' })
  @IsString({ message: 'CNIC number must be a string' })
  @Matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, { 
    message: 'CNIC must be in format: 00000-0000000-0' 
  })
  cniNumber: string;

  @IsNotEmpty({ message: 'Relationship is required' })
  @IsEnum(['Father', 'Mother', 'Guardian', 'Other'], { 
    message: 'Relationship must be one of: Father, Mother, Guardian, Other' 
  })
  relationship: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(\+92|0)[0-9]{10}$/, { 
    message: 'Phone must be a valid Pakistan number (e.g., +923001234567 or 03001234567)' 
  })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
