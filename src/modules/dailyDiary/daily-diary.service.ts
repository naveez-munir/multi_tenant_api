import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { DailyDiary, DailyDiarySchema } from './schemas/daily-diary.schema';
import { CreateDailyDiaryDto } from './dto/create-daily-diary.dto';
import { BaseService } from 'src/common/services/base.service';
import { StudentService } from 'src/modules/student/student.service';
import { DiaryQueryDto } from './dto/diary-query.dto';
import { UpdateDailyDiaryDto } from './dto/update-daily-diary.dto';

@Injectable()
export class DailyDiaryService extends BaseService<DailyDiary> {
  constructor(
    private readonly studentService: StudentService
  ) {
    super('DailyDiary', DailyDiarySchema);
  }

  async createDiaryEntry(
    connection: Connection,
    createDto: CreateDailyDiaryDto,
    teacherId: string
  ): Promise<DailyDiary> {
    try {
      const repository = this.getRepository(connection);
      
      const data = {
        ...createDto,
        classId: Types.ObjectId.createFromHexString(createDto.classId),
        createdBy: Types.ObjectId.createFromHexString(teacherId),
        subjectTasks: createDto.subjectTasks?.map(task => ({
          ...task,
          subject: Types.ObjectId.createFromHexString(task.subject)
        }))
      };

      return repository.create(data);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Diary entry already exists for this class and date');
      }
      throw error;
    }
  }

  async getDiaryEntriesByClass(
    connection: Connection,
    classId: string,
    query: DiaryQueryDto
  ): Promise<DailyDiary[]> {
    const repository = this.getRepository(connection);
    
    const filter = {
      classId: Types.ObjectId.createFromHexString(classId),
      date: {}
    };

    if (query.startDate) {
      filter.date['$gte'] = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.date['$lte'] = new Date(query.endDate);
    }

    const entries = await repository.find(filter);
    return this.processDiaryEntries(entries);
  }

  async getDiaryEntriesForStudent(
    connection: Connection,
    studentId: string,
    query: DiaryQueryDto
  ): Promise<DailyDiary[]> {
    // Get student's class using student service
    const student = await this.studentService.findById(connection, studentId);
    
    if (!student?.class) {
      throw new NotFoundException('Student or class not found');
    }

    return this.getDiaryEntriesByClass(
      connection,
      student.class.toString(),
      query
    );
  }

  async getDiaryEntry(
    connection: Connection,
    id: string
  ): Promise<DailyDiary> {
    const repository = this.getRepository(connection);
    const entry = await repository.findById(id);

    if (!entry) {
      throw new NotFoundException('Diary entry not found');
    }

    return entry;
  }

  async updateDiaryEntry(
    connection: Connection,
    id: string,
    updateDto: UpdateDailyDiaryDto,
    teacherId: string
  ): Promise<DailyDiary> {
    const repository = this.getRepository(connection);
    const entry = await repository.findById(id);
  
    if (!entry) {
      throw new NotFoundException('Diary entry not found');
    }
  
    if (entry.createdBy.toString() !== teacherId) {
      throw new UnauthorizedException('Only the creator can update the diary entry');
    }
  
    // Convert the updateData to proper types
    const updateData: Partial<DailyDiary> = {
      ...(updateDto.title && { title: updateDto.title }),
      ...(updateDto.description && { description: updateDto.description }),
      ...(updateDto.date && { date: new Date(updateDto.date) }),
      ...(updateDto.classId && { 
        classId: Types.ObjectId.createFromHexString(updateDto.classId) 
      }),
      ...(updateDto.subjectTasks && {
        subjectTasks: updateDto.subjectTasks.map(task => ({
          ...task,
          subject: Types.ObjectId.createFromHexString(task.subject)
        }))
      })
    };
  
    const updated = await repository.findByIdAndUpdate(id, updateData);
    if (!updated) {
      throw new NotFoundException('Failed to update diary entry');
    }
  
    return updated;
  }

  async deleteDiaryEntry(
    connection: Connection,
    id: string,
    teacherId: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    const entry = await repository.findById(id);

    if (!entry) {
      throw new NotFoundException('Diary entry not found');
    }

    if (entry.createdBy.toString() !== teacherId) {
      throw new UnauthorizedException('Only the creator can delete the diary entry');
    }

    return repository.delete(id);
  }

  // Helper method to process diary entries
  private processDiaryEntries(entries: DailyDiary[]): DailyDiary[] {
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async addAttachment(
    connection: Connection,
    diaryId: string,
    attachment: { title: string; fileUrl: string; fileType: string },
    teacherId: string
  ): Promise<DailyDiary> {
    const repository = this.getRepository(connection);
    const entry = await repository.findById(diaryId);

    if (!entry) {
      throw new NotFoundException('Diary entry not found');
    }

    if (entry.createdBy.toString() !== teacherId) {
      throw new UnauthorizedException('Only the creator can add attachments');
    }

    const attachments = entry.attachments || [];
    attachments.push({
      ...attachment,
      uploadedAt: new Date()
    });

    return repository.findByIdAndUpdate(diaryId, { attachments });
  }

  async removeAttachment(
    connection: Connection,
    diaryId: string,
    attachmentId: string,
    teacherId: string
  ): Promise<DailyDiary> {
    const repository = this.getRepository(connection);
    const entry = await repository.findById(diaryId);

    if (!entry) {
      throw new NotFoundException('Diary entry not found');
    }

    if (entry.createdBy.toString() !== teacherId) {
      throw new UnauthorizedException('Only the creator can remove attachments');
    }

    const attachments = entry.attachments?.filter(a => a._id.toString() !== attachmentId) || [];
    return repository.findByIdAndUpdate(diaryId, { attachments });
  }
}
