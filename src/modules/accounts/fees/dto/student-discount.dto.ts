import { PartialType } from "@nestjs/mapped-types";
import { IsMongoId, IsEnum, IsNumber, Min, Max, IsArray, IsOptional, IsDate, IsString } from "class-validator";
import { DiscountType, ValueType } from "../../enums/studentFeeEnums";
import { Transform } from "class-transformer";
import { Types } from "mongoose";

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

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(String(value)) : undefined)
  createdBy?: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(String(value)) : undefined)
  updatedBy?: Types.ObjectId;

}

export class UpdateStudentDiscountDto extends PartialType(CreateStudentDiscountDto) {}
