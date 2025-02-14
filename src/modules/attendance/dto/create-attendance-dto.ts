import { IsNotEmpty, IsString, IsMongoId, IsDate, IsEnum, IsOptional } from "class-validator";
import { Types } from "mongoose";
import { AttendanceStatus } from "src/common/interfaces/attendanceStatuses";
import { AttendanceType } from "src/common/interfaces/attendanceType";
import { Transform, Type } from "class-transformer";

export class CreateAttendanceDto {
  @IsNotEmpty()
  @IsEnum(AttendanceType)
  userType: AttendanceType;

  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  classId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;
}
