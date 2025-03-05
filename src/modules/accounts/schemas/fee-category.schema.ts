import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { FeeFrequency } from "../enums/studentFeeEnums";
import { BaseSchema } from "./accountBase.schema";

@Schema()
export class FeeCategory extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ 
    type: String,
    enum: FeeFrequency,
    required: true 
  })
  frequency: FeeFrequency;

  @Prop({ type: Boolean, default: true })
  isRefundable: boolean;

  @Prop()
  description?: string;
}

export const FeeCategorySchema = SchemaFactory.createForClass(FeeCategory);
