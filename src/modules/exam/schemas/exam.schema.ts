import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '../../../common/schemas/base.schema';
import { Types } from 'mongoose';

@Schema({
  collection: 'exams',
})
export class Exam extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'ExamType', required: true })
  examType: Types.ObjectId;

  @Prop({ required: true })
  academicYear: string; // e.g., "2023-2024"

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  description?: string;

  @Prop({
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'ResultDeclared'],
    default: 'Scheduled',
  })
  status: string;

  @Prop([
    {
      subject: { type: Types.ObjectId, ref: 'Subject', required: true },
      examDate: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      maxMarks: { type: Number, required: true, min: 0 },
      passingMarks: { type: Number, required: true, min: 0 },
    },
  ])
  subjects: Record<string, any>[];
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

ExamSchema.index(
  { academicYear: 1, classId: 1, examType: 1 },
  {
    unique: true,
  },
);
