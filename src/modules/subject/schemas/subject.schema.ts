import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from 'src/common/schemas/base.schema';

@Schema({
  collection: 'subjects'
})
export class Subject extends BaseEntity {

  @Prop({required: true })
  subjectName: string;

  @Prop({ unique: true,required: true })
  subjectCode: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
