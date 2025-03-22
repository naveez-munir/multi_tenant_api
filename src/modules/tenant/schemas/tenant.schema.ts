import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({
  timestamps: true,
  collection: 'tenants',
})
export class Tenant {
  _id: Types.ObjectId;
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  databaseName: string;

  @Prop({ required: true, default: 'active' })
  status: 'active' | 'inactive';

  @Prop({ required: true, default: 150 })
  maxStudents: number;

  @Prop({ required: true, default: 10 })
  maxTeachers: number;

  @Prop({ required: true, default: 5 })
  maxStaff: number;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
