import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from 'src/common/schemas/base.schema';


@Schema()
export class ExamResult extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true })
  examId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop([{
    subject: { type: Types.ObjectId, ref: 'Subject', required: true },
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    remarks: String
  }])
  subjectResults: Record<string, any>[];

  @Prop()
  totalMarks: number;

  @Prop()
  percentage: number;

  @Prop()
  grade?: string;

  @Prop({ type: Number })
  rank?: number;

  @Prop()
  remarks?: string;
}

export const examResultSchema = SchemaFactory.createForClass(ExamResult);
