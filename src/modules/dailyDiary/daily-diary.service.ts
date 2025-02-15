import { 
  Injectable, 
  ConflictException, 
  NotFoundException, 
  UnauthorizedException,
  BadRequestException 
} from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { DailyDiary, DailyDiarySchema } from './schemas/daily-diary.schema';
import { CreateDailyDiaryDto } from './dto/create-daily-diary.dto';
import { BaseService } from 'src/common/services/base.service';
import { StudentService } from 'src/modules/student/student.service';
import { DiaryQueryDto } from './dto/diary-query.dto';
import { UpdateDailyDiaryDto } from './dto/update-daily-diary.dto';
import { AttachmentDto } from './dto/attachment.dto';
import { SubjectSchema } from '../subject/schemas/subject.schema';
import { ClassSchema } from '../class/schemas/class.schema';
import { TeacherSchema } from '../teacher/schemas/teacher.schema';
//TODO need to add the support the dairy should be added by teacher no other user
//TODO also format the response , no need to send extra data

@Injectable()
export class DailyDiaryService extends BaseService<DailyDiary> {
  constructor(
    private readonly studentService: StudentService
  ) {
    super('DailyDiary', DailyDiarySchema);
  }

  private async makeConnection(connection: Connection): Promise<void> {
    try {
      connection.model('Subject', SubjectSchema);
      connection.model('Class', ClassSchema);
      // connection.model('Teacher', TeacherSchema);
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(
    connection: Connection,
    query: DiaryQueryDto
  ): Promise<DailyDiary[]> {
    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    const filter: any = {};

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) {
        filter.date['$gte'] = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.date['$lte'] = new Date(query.endDate);
      }
    }

    const entries = await repository.findWithOptions(filter, {
      populate: {
        path: 'classId subjectTasks.subject',
      },
      sort: { date: -1 }
    });

    return entries;
  }

  async createDiaryEntry(
    connection: Connection,
    createDto: CreateDailyDiaryDto,
    teacherId: string
  ): Promise<DailyDiary> {
    if (!Types.ObjectId.isValid(createDto.classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    try {
      const repository = this.getRepository(connection);
      
      // Check for existing entry
      const existingEntry = await repository.findOne({
        classId: Types.ObjectId.createFromHexString(createDto.classId),
        date: new Date(createDto.date)
      });

      if (existingEntry) {
        throw new ConflictException('Diary entry already exists for this class and date');
      }

      const data = {
        ...createDto,
        classId: Types.ObjectId.createFromHexString(createDto.classId),
        createdBy: Types.ObjectId.createFromHexString(teacherId),
        subjectTasks: createDto.subjectTasks?.map(task => ({
          ...task,
          subject: Types.ObjectId.createFromHexString(task.subject)
        }))
      };

      const newEntry = await repository.create(data);
      return this.getDiaryEntry(connection, newEntry._id.toString());
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
    if (!Types.ObjectId.isValid(classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    
    const filter: any = {
      classId: Types.ObjectId.createFromHexString(classId)
    };

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) {
        filter.date['$gte'] = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.date['$lte'] = new Date(query.endDate);
      }
    }

    const entries = await repository.findWithOptions(filter, {
      populate: {
        path: 'classId subjectTasks.subject'
      },
      sort: { date: -1 }
    });

    return entries;
  }

  async getDiaryEntriesForStudent(
    connection: Connection,
    studentId: string,
    query: DiaryQueryDto
  ): Promise<DailyDiary[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid diary entry ID');
    }

    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    const entries = await repository.findWithOptions(
      { _id: Types.ObjectId.createFromHexString(id) },
      {
        populate: {
          path: 'classId subjectTasks.subject',
        }
      }
    );

    if (!entries || !entries.length) {
      throw new NotFoundException('Diary entry not found');
    }

    return entries[0];
  }

  async updateDiaryEntry(
    connection: Connection,
    id: string,
    updateDto: UpdateDailyDiaryDto,
    teacherId: string
  ): Promise<DailyDiary> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid diary entry ID');
    }

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

    // Check for duplicate entry if date or classId is being updated
    if (updateDto.date || updateDto.classId) {
      const existingEntry = await repository.findOne({
        _id: { $ne: Types.ObjectId.createFromHexString(id) },
        classId: updateData.classId || entry.classId,
        date: updateData.date || entry.date
      });

      if (existingEntry) {
        throw new ConflictException('Diary entry already exists for this class and date');
      }
    }
  
    await repository.findByIdAndUpdate(id, updateData);
    return this.getDiaryEntry(connection, id);
  }

  async deleteDiaryEntry(
    connection: Connection,
    id: string,
    teacherId: string
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid diary entry ID');
    }

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

  async addAttachment(
    connection: Connection,
    diaryId: string,
    attachment: AttachmentDto,
    teacherId: string
  ): Promise<DailyDiary> {
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('Invalid diary entry ID');
    }

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

    await repository.findByIdAndUpdate(diaryId, { attachments });
    return this.getDiaryEntry(connection, diaryId);
  }

  async removeAttachment(
    connection: Connection,
    diaryId: string,
    attachmentId: string,
    teacherId: string
  ): Promise<DailyDiary> {
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('Invalid diary entry ID');
    }

    const repository = this.getRepository(connection);
    const entry = await repository.findById(diaryId);

    if (!entry) {
      throw new NotFoundException('Diary entry not found');
    }

    if (entry.createdBy.toString() !== teacherId) {
      throw new UnauthorizedException('Only the creator can remove attachments');
    }

    const attachments = entry.attachments?.filter(a => a._id.toString() !== attachmentId) || [];
    await repository.findByIdAndUpdate(diaryId, { attachments });
    return this.getDiaryEntry(connection, diaryId);
  }
}
