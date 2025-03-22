import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { BaseEmployeeEntity } from 'src/common/schemas/basicEmployee.schema';

@Schema()
export class Teacher extends BaseEmployeeEntity {
  @Prop([String])
  subjects?: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class' })
  classTeacherOf?: Types.ObjectId;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);
