import { Transform, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { ValueType } from "../../enums/studentFeeEnums";
import { PartialType } from "@nestjs/mapped-types";

export class FeeComponentDto {
  @IsMongoId()
  feeCategory: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  dueDay?: number;

  @IsEnum(ValueType)
  @IsOptional()
  lateChargeType?: ValueType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lateChargeValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gracePeriod?: number;

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @IsBoolean()
  @IsOptional()
  discountAllowed?: boolean;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}

export class CreateFeeStructureDto {
  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsMongoId()
  classId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeComponentDto)
  feeComponents: FeeComponentDto[];
}

export class BulkGenerateFeeStructureDto {
  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsArray()
  @IsMongoId({ each: true })
  classIds: string[];

  @ValidateNested({ each: true })
  @Type(() => FeeComponentDto)
  @ArrayMinSize(1)
  feeComponents: FeeComponentDto[];
}
export class CloneFeeStructureDto {
  @IsString()
  @IsNotEmpty()
  newAcademicYear: string;

  @IsMongoId()
  @IsOptional()
  newClassId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  incrementPercentage?: number;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => FeeComponentOverrideDto)
  componentOverrides?: FeeComponentOverrideDto[];

  @IsBoolean()
  @IsOptional()
  keepDiscounts?: boolean = false;
}

export class FeeComponentOverrideDto {
  @IsMongoId()
  feeCategoryId: string;

  @IsNumber()
  @Min(0)
  newAmount: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  newDueDay?: number;

  @IsEnum(ValueType)
  @IsOptional()
  newLateChargeType?: ValueType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  newLateChargeValue?: number;
}

export class ListFeeStructureDto {
  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortByDueDate?: 'asc' | 'desc';

  @IsBoolean()
  @IsOptional()
  includeComponents?: boolean = true;

  @IsBoolean()
  @IsOptional()
  includeClass?: boolean = true;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;
}

export class UpdateFeeStructureDto extends PartialType(CreateFeeStructureDto) {}

