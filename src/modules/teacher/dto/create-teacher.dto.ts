import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { BaseEmployeeDto } from 'src/common/dto';

export class CreateTeacherDto extends BaseEmployeeDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsMongoId()
  classTeacherOf?: Types.ObjectId;
}

