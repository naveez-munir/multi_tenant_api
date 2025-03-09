import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEmployeeEntity } from 'src/common/schemas/basicEmployee.schema';
import { UserRole } from 'src/common/interfaces/roleEnum';

@Schema()
export class Staff extends BaseEmployeeEntity {
  @Prop({
    type: String,
    enum: [
      UserRole.ACCOUNTANT,
      UserRole.LIBRARIAN,
      UserRole.ADMIN,
      UserRole.PRINCIPAL,
      UserRole.DRIVER,
      UserRole.SECURITY,
      UserRole.CLEANER,
      UserRole.TENANT_ADMIN,
    ],
    required: true
  })
  designation: string;

  @Prop()
  department?: string;

  @Prop({ type: String })
  jobDescription?: string;

  @Prop({ type: String })
  reportingTo?: string;

  // Skills specific to the role
  @Prop([String])
  skills?: string[];

  // Additional responsibilities
  @Prop([String])
  responsibilities?: string[];

  @Prop({
    type: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
      address: { type: String }
    }
  })
  emergencyContact?: Record<string, any>;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
