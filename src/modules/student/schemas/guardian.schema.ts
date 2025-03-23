import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../../common/schemas/base.schema';

@Schema({
  collection: 'guardians',
})
export class Guardian extends BaseEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  cniNumber: string;

  @Prop({ 
    type: String, 
    enum: ['Father', 'Mother', 'Guardian', 'Other'], 
    required: true 
  })
  relationship: string;

  @Prop({ required: true })
  phone: string;

  @Prop({unique: true})
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Student' }], default: [] })
  students: Types.ObjectId[];
}

export const GuardianSchema = SchemaFactory.createForClass(Guardian);

GuardianSchema.index({ cniNumber: 1 }, { unique: true });
