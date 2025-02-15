import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from 'src/common/schemas/base.schema';

@Schema({
  timestamps: true,
  collection: 'daily_diaries'
})
export class DailyDiary extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  // For subjects like homework, assignments, etc.
  @Prop([{
    subject: { type: Types.ObjectId, ref: 'Subject', required: true },
    task: { type: String, required: true },
    dueDate: { type: Date },
    additionalNotes: String
  }])
  subjectTasks: Record<string, any>[];

  // Optional attachments (like worksheets, notes)
  @Prop([{
    title: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }])
  attachments?: Record<string, any>[];

  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true })
  createdBy: Types.ObjectId;
}

export const DailyDiarySchema = SchemaFactory.createForClass(DailyDiary);

DailyDiarySchema.index({ classId: 1, date: 1 }, { unique: true });
