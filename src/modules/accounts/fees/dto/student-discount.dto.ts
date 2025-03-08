import { PartialType } from "@nestjs/mapped-types";
import { IsMongoId, IsEnum, IsNumber, Min, Max, IsArray, IsOptional, IsDate, IsString } from "class-validator";
import { DiscountType, ValueType } from "../../enums/studentFeeEnums";

export class CreateStudentDiscountDto {
  @IsMongoId()
  studentId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsEnum(ValueType)
  discountValueType: ValueType;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountValue: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  applicableCategories?: string[];

  @IsDate()
  startDate: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateStudentDiscountDto extends PartialType(CreateStudentDiscountDto) {}
