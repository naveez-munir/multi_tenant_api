import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseSchema } from "src/modules/accounts/schemas/accountBase.schema";

@Schema()
export class LeaveBalance extends BaseSchema {
  @Prop({ type: Types.ObjectId, refPath: 'employeeType' })
  employeeId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['Teacher', 'Staff'],
    required: true 
  })
  employeeType: string;

  @Prop({ required: true })
  year: number;

  @Prop({ type: Number, default: 0 })
  sickLeaveAllocation: number;

  @Prop({ type: Number, default: 0 })
  sickLeaveUsed: number;

  @Prop({ type: Number, default: 0 })
  casualLeaveAllocation: number;

  @Prop({ type: Number, default: 0 })
  casualLeaveUsed: number;

  @Prop({ type: Number, default: 0 })
  earnedLeaveAllocation: number;

  @Prop({ type: Number, default: 0 })
  earnedLeaveUsed: number;
  
  @Prop({ type: Number, default: 0 })
  unpaidLeaveUsed: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalance);
