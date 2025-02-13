import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  className: string;

  @IsOptional()
  @IsString()
  classSection?: string;

  @IsOptional()
  @IsString()
  classGradeLevel?: string;

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(String(value)) : value))
  classTeacher?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(String(value)) : value))
  classTempTeacher?: Types.ObjectId;


  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(String(value)) : value))
  classSubjects?: Types.ObjectId[];
}
