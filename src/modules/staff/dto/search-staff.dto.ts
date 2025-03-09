import { IsEnum, IsOptional, IsString } from "@nestjs/class-validator";
import { UserRole } from "src/common/interfaces/roleEnum";

export class SearchStaffDto {
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
  designation?: UserRole;

  @IsOptional()
  @IsString()
  department?: string;
}
