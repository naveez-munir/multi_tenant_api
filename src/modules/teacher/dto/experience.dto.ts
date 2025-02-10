import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class ExperienceDto {
  @IsNotEmpty()
  @IsString()
  institution: string;

  @IsNotEmpty()
  @IsString()
  position: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  fromDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  experienceLatterUrl?: string;
}
