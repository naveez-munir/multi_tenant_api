import { IsArray, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Types } from "mongoose";
import { AttendanceStatus } from "src/common/interfaces/attendanceStatuses";
import { AttendanceType } from "src/common/interfaces/attendanceType";
import { Transform, Type } from "class-transformer";

export class BatchAttendanceDto {
  @IsNotEmpty()
  @IsEnum(AttendanceType)
  userType: AttendanceType;

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  classId: Types.ObjectId;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAttendanceRecord)
  records: BatchAttendanceRecord[];
}

class BatchAttendanceRecord {
  @IsNotEmpty()
  @IsMongoId()
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BaseAttendanceFilterDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class ClassAttendanceFilterDto extends BaseAttendanceFilterDto {
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export class UserAttendanceFilterDto extends BaseAttendanceFilterDto {
  @IsOptional()
  @IsEnum(AttendanceType)
  userType?: AttendanceType;
}

export class MonthlyReportFilterDto {
  @IsNotEmpty()
  @IsNumber()
  month: number;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsOptional()
  @IsEnum(AttendanceType)
  userType?: AttendanceType;

  @IsOptional()
  @IsMongoId()
  classId?: Types.ObjectId;
}
