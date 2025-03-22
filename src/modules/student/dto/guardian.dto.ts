import { IsNotEmpty, IsString, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { IsPakistaniCNIC, IsPakistaniPhone } from 'src/common/dto/common-validations.dto';

export class GuardianDto {
  @IsNotEmpty({ message: 'Guardian name is required' })
  @IsString({ message: 'Guardian name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'CNIC number is required' })
  @IsString({ message: 'CNIC number must be a string' })
  @IsPakistaniCNIC()
  cniNumber: string;

  @IsNotEmpty({ message: 'Relationship is required' })
  @IsEnum(['Father', 'Mother', 'Guardian', 'Other'], { 
    message: 'Relationship must be one of: Father, Mother, Guardian, Other' 
  })
  relationship: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @IsPakistaniPhone()
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
