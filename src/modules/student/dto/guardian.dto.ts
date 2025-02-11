import { IsNotEmpty, IsString, IsEnum, IsEmail, IsOptional } from 'class-validator';

export class GuardianDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  cniNumber: string;

  @IsNotEmpty()
  @IsEnum(['Father', 'Mother', 'Guardian', 'Other'])
  relationship: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
