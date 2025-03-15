import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseSchema } from "src/modules/accounts/schemas/accountBase.schema";

@Schema()
export class StudentLeave extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['MEDICAL', 'FAMILY_EMERGENCY', 'PLANNED_ABSENCE', 'OTHER'],
    required: true 
  })
  leaveType: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  numberOfDays: number;

  @Prop()
  reason: string;
  
  @Prop()
  supportingDocumentUrl?: string;

  @Prop({ 
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  })
  status: string;

  // Who approved the leave (usually a teacher or administrator)
  @Prop({ type: Types.ObjectId, refPath: 'approverType' })
  approvedBy?: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['Teacher', 'Staff'],
  })
  approverType?: string;

  @Prop()
  approvalDate?: Date;

  @Prop()
  comments?: string;

  // References to affected classes
  @Prop([{ type: Types.ObjectId, ref: 'Class' }])
  affectedClasses?: Types.ObjectId[];

  // Flag to indicate if the leave has been synced with attendance records
  @Prop({ type: Boolean, default: false })
  isSyncedWithAttendance: boolean;
  
  // Parent/Guardian who requested the leave
  @Prop({ type: Types.ObjectId, ref: 'Parent' })
  requestedByParent?: Types.ObjectId;
}

export const StudentLeaveSchema = SchemaFactory.createForClass(StudentLeave);
