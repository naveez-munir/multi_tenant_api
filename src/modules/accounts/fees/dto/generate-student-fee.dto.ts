import { IsMongoId, IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, Min, Max } from "class-validator";

export class GenerateStudentFeeDto {
  @IsMongoId()
  @IsNotEmpty()
  studentId: string;

  @IsMongoId()
  @IsNotEmpty()
  feeStructureId: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsEnum(['MONTHLY', 'QUARTERLY', 'ONE_TIME'])
  billType: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  billMonth?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4)
  quarter?: number;
}
