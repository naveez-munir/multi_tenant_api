import { IsMongoId, IsEnum, IsNumber, IsOptional, IsArray, IsString, Min, IsNotEmpty } from "class-validator";
import { FeeFrequency, DiscountType } from "../../enums/studentFeeEnums";

export class GenerateStudentFeeDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  feeStructureId: string;

  @IsEnum(FeeFrequency)
  billType: FeeFrequency;

  @IsNumber()
  @IsOptional()
  billMonth?: number;

  @IsNumber()
  @IsOptional()
  quarter?: number;
}

export class BulkGenerateStudentFeeDto {
  @IsArray()
  @IsMongoId({ each: true })
  studentIds: string[];

  @IsMongoId()
  feeStructureId: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsEnum(FeeFrequency)
  billType: FeeFrequency;

  @IsNumber()
  @IsOptional()
  billMonth?: number;
}

export class ApplyDiscountDto {
  @IsString()
  feeCategoryId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  discountAmount: number;
}
