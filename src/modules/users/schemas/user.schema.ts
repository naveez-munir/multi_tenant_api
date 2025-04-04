import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../../../common/schemas/base.schema';
import { UserRole } from 'src/common/interfaces/roleEnum';

@Schema({
  collection: 'users',
})
export class User extends BaseEntity {
  @Prop({ unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true})
  cnic?: string

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
