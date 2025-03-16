import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseUserEntity } from 'src/common/schemas/basicUser.schema';

@Schema({
  collection: 'students',
})
export class Student extends BaseUserEntity {
  @Prop({ required: true })
  dateOfBirth: Date;

  // Parent/Guardian Information
  @Prop({
    type: {
      name: { type: String, required: true },
      cniNumber: { type: String, required: true },
      relationship: { type: String, enum: ['Father', 'Mother', 'Guardian', 'Other'], required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
  })
  guardian: Record<string, any>;

  // Academic Information
  @Prop({ required: true })
  gradeLevel: string;

  @Prop({ type: Types.ObjectId, ref: 'Class' })
  class?: Types.ObjectId;

  @Prop({ unique: true, sparse: true })
  rollNumber?: string;

  @Prop({ })
  enrollmentDate?: Date;

  @Prop({ required: true })
  admissionDate: Date;

  @Prop({
    type: String,
    enum: ['Completed', 'Migrated', 'Expelled', 'Withdrawn', 'None'],
    default: 'None',
  })
  exitStatus?: string;

  @Prop()
  exitDate?: Date;

  @Prop()
  exitRemarks?: string;

  @Prop({
    required: true,
    enum: ['Active', 'Inactive', 'Graduated', 'Expelled', 'Withdrawn'],
    default: 'Active',
  })
  status: string;

  @Prop({ type: Number, min: 0, max: 100 })
  attendancePercentage?: number;

  // Documents
  @Prop({
    type: [
      {
        documentType: { type: String, required: true },
        documentUrl: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  documents: Record<string, any>[];

  @Prop({ type: Types.ObjectId, ref: 'User'})
  userId: Types.ObjectId;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

StudentSchema.index({ firstName: 1,email: 1,  cniNumber: 1,});


