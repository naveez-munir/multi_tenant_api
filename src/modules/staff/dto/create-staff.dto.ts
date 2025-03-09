import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { BaseEmployeeDto } from 'src/common/dto';
import { UserRole } from 'src/common/interfaces/roleEnum';

// Emergency Contact DTO
export class EmergencyContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateStaffDto extends BaseEmployeeDto {
  @IsEnum([
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
    UserRole.ADMIN,
    UserRole.PRINCIPAL,
    UserRole.DRIVER,
    UserRole.SECURITY,
    UserRole.CLEANER,
    UserRole.TENANT_ADMIN,
  ])
  designation: UserRole;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  @IsString()
  reportingTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(['Active', 'OnLeave', 'Resigned', 'Terminated'])
  status: string;
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
