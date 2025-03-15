import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseSchema } from "src/modules/accounts/schemas/accountBase.schema";

@Schema()
export class Leave extends BaseSchema {
  @Prop({ type: Types.ObjectId, refPath: 'employeeType' })
  employeeId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['Teacher', 'Staff'],
    required: true 
  })
  employeeType: string;

  @Prop({ 
    type: String, 
    enum: ['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER'],
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

  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  })
  status: string;

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

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: Boolean, default: false })
  isDeductionApplied: boolean;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);
