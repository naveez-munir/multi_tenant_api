import { Transform } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, Min, Max } from "class-validator";
import { Types } from "mongoose";

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

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(String(value)) : undefined)
  createdBy?: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(String(value)) : undefined)
  updatedBy?: Types.ObjectId;
}
