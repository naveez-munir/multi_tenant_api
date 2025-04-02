import { Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { BaseEntity } from '../../../common/schemas/base.schema';
import mongoose, { Types } from 'mongoose';
@Schema({
  collection: 'classes'
})
export class Class extends BaseEntity {

  @Prop({ required: true })
  className: string;

  @Prop({ default: 'A'})
  classSection: string;

  @Prop()
  classGradeLevel: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' })
  classTeacher?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' })
  classTempTeacher?: Types.ObjectId;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }])
  classSubjects?: Types.ObjectId[];
}

export const ClassSchema = SchemaFactory.createForClass(Class);

ClassSchema.index({ className: 1, classSection: 1 }, { unique: true });
