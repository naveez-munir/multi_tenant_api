import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '../../../common/schemas/base.schema';
import { Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'students',
})
export class Student extends BaseEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  cniNumber: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true, enum: ['Male', 'Female'] })
  gender: string;

  @Prop({ enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] })
  bloodGroup?: string;

  @Prop()
  photoUrl?: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, unique: true, default: null })
  email?: string;

  @Prop()
  address?: string;

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
  section?: Types.ObjectId;

  @Prop({ required: true, unique: true })
  rollNumber?: string;

  @Prop({ required: true })
  enrollmentDate: Date;

  @Prop({ required: true })
  admissionDate: Date;

  @Prop({
    type: String,
    enum: ['Completed', 'Migrated', 'Expelled', 'Withdrawn', 'None'],
    default: 'None',
  })
  exitStatus: string; // Reason for leaving the school

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
  })
  documents: Record<string, any>[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

StudentSchema.index({ firstName: 1,email: 1,  cniNumber: 1,});


