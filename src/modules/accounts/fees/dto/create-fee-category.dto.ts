import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from "class-validator";
import { PartialType } from '@nestjs/mapped-types';

import { FeeFrequency } from "../../enums/studentFeeEnums";

export class CreateFeeCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  frequency: string;

  @IsBoolean()
  @IsOptional()
  isRefundable?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ListFeeCategoryDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(FeeFrequency)
  @IsOptional()
  frequency?: FeeFrequency;
}


export class UpdateFeeCategoryDto extends PartialType(CreateFeeCategoryDto) {}
