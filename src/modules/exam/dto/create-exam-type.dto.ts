import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateExamTypeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightAge: number;
}
