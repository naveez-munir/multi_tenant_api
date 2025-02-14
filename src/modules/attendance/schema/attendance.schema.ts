import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { AttendanceStatus } from "src/common/interfaces/attendanceStatuses";
import { AttendanceType } from "src/common/interfaces/attendanceType";
import { BaseEntity } from "src/common/schemas/base.schema";


@Schema()
export class Attendance extends BaseEntity {
  @Prop({ type: String, required: true, enum: AttendanceType })
  userType: AttendanceType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userType' })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true, enum: AttendanceStatus })
  status: AttendanceStatus;

  @Prop({ type: String })
  reason?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class' })
  classId?: mongoose.Types.ObjectId;  // Only for students

  @Prop({ type: String })
  checkInTime?: string;

  @Prop({ type: String })
  checkOutTime?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// ✅ Unique index to ensure one attendance record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
