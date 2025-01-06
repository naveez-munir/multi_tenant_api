import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../interfaces/roleEnum';

@Schema()
export class BaseEntity extends Document {
  @Prop({
    required: function(this: any) {
      return !this.role || this.role !== UserRole.SUPER_ADMIN;
    }
  })
  tenantId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}
