import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { ValueType } from "../enums/studentFeeEnums";
import { BaseSchema } from "./accountBase.schema";

@Schema()
export class FeeStructure extends BaseSchema {
  @Prop({ required: true })
  academicYear: string;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop([{
    feeCategory: { type: Types.ObjectId, ref: 'FeeCategory', required: true },
    amount: { type: Number, required: true },
    dueDay: { type: Number, default: 10 },
    lateChargeType: { 
      type: String,
      enum: ValueType,
      default: ValueType.FIXED
    },
    lateChargeValue: { type: Number, default: 0 },
    gracePeriod: { type: Number, default: 0 },
    isOptional: { type: Boolean, default: false },
    discountAllowed: { type: Boolean, default: true }
  }])
  feeComponents: Record<string, any>[];
}

export const feeStructureSchema = SchemaFactory.createForClass(FeeStructure);
