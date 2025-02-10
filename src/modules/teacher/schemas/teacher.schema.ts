import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { BaseUserEntity } from 'src/common/schemas/basicUser.schema';
@Schema()
export class Teacher extends BaseUserEntity {

  @Prop({ required: true })
  joiningDate: Date;

  @Prop()
  leavingDate?: Date;

  @Prop({
    type: String,
    enum: ['Active', 'OnLeave', 'Resigned', 'Terminated'],
    default: 'Active'
  })
  employmentStatus: string;

  @Prop([String])
  qualifications: string[];

  @Prop([String])
  subjects?: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class' })
  classTeacherOf?: Types.ObjectId;

  // Education Details
  @Prop([{
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number, required: true },
    certificateUrl: { type: String },
  }])
  educationHistory?: Record<string, any>[];

  // Experience history
  @Prop([{
    institution: { type: String, required: true },
    position: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date },
    description: String,
    experienceLatterUrl: { type: String },
  }])
  experience?: Record<string, any>[];


  // Documents like cnic images etc
  @Prop([{
    documentType: { type: String, required: true },
    documentUrl: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
  }])
  documents: Record<string, any>[];

  @Prop({ type: Types.ObjectId, ref: 'User'})
  userId?: Types.ObjectId;
}
export const TeacherSchema = SchemaFactory.createForClass(Teacher);
