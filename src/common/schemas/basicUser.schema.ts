import { Prop, Schema } from '@nestjs/mongoose';
import { BaseEntity } from './base.schema';
import { Types } from 'mongoose';

@Schema()
export class BaseUserEntity extends BaseEntity {
  _id: Types.ObjectId;
  
  @Prop({ required: true, unique: true })
  cniNumber: string;

  @Prop({ required: true, enum: ['Male', 'Female'] })
  gender: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop({ enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] })
  bloodGroup?: string;

  @Prop()
  photoUrl?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;
}
