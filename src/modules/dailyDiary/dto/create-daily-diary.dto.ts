import { Type } from 'class-transformer';
import { IsDate, IsMongoId, IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';

class SubjectTaskDto {
  @IsMongoId()
  subject: string;

  @IsString()
  @IsNotEmpty()
  task: string;

  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

class AttachmentDto {
  @IsString()
  title: string;

  @IsString()
  fileUrl: string;

  @IsString()
  fileType: string;
}

export class CreateDailyDiaryDto {
  @IsMongoId()
  classId: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @ValidateNested({ each: true })
  @Type(() => SubjectTaskDto)
  subjectTasks: SubjectTaskDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
