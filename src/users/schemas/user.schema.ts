import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../../common/schemas/base.schema';

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends BaseEntity {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});