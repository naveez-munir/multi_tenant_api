import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from 'src/common/schemas/base.schema';

@Schema()
export class ExamType extends BaseEntity {

  @Prop({ required: true, unique: true })
  name: string;  // 'Mid Term', 'Final Term', 'Pre-Board' etc.

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, required: true })
  weightAge: number;  // Percentage weightAge in final result
}
export const examTypeSchema = SchemaFactory.createForClass(ExamType);
