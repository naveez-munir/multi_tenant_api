import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Exam, ExamSchema } from '../schemas/exam.schema';
import { BaseService } from '../../../common/services/base.service';
import { CreateExamDto } from '../dto/exam/create-exam.dto';
import { UpdateExamDto } from '../dto/exam/update-exam.dto';
import { ExamQueryDto } from '../dto/exam/exam-query.dto';
import { ExamResponseDto } from '../dto/exam/exam-response.dto';
import { SubjectSchema } from 'src/modules/subject/schemas/subject.schema';
import { examTypeSchema } from '../schemas/exam-type.schema';
import { ClassSchema } from 'src/modules/class/schemas/class.schema';

@Injectable()
export class ExamService extends BaseService<Exam> {
  constructor() {
    super('Exam', ExamSchema);
  }

  private async initializeModels(connection: Connection) {
    try {
      // Initialize required models if they don't exist
      if (!connection.models['Subject']) {
        connection.model('Subject', SubjectSchema);
      }
      if (!connection.models['ExamType']) {
        connection.model('ExamType', examTypeSchema);
      }
      if (!connection.models['Class']) {
        connection.model('Class', ClassSchema);
      }
    } catch (error) {
      console.error('Model initialization error:', error);
    }
  }

  private validateExamDates(startDate: Date, endDate: Date, subjectDates: Date[]) {
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const invalidDates = subjectDates.some(
      date => date < startDate || date > endDate
    );
    if (invalidDates) {
      throw new BadRequestException('Subject exam dates must be within exam date range');
    }
  }

  private async validateSubjects(connection: Connection, subjectIds: string[]) {
    try {
      const subjectRepo = connection.model("Subject", SubjectSchema);
      const subjects = await subjectRepo.find({ 
        _id: { $in: subjectIds.map(id => Types.ObjectId.createFromHexString(id)) }
      });
      if (subjects.length !== subjectIds.length) {
        throw new BadRequestException('One or more subjects not found');
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Error validating subjects');
    }
  }

  async createExam(
    connection: Connection,
    createDto: CreateExamDto
  ): Promise<ExamResponseDto> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
  
      // Validate dates
      this.validateExamDates(
        new Date(createDto.startDate),
        new Date(createDto.endDate),
        createDto.subjects.map(s => new Date(s.examDate))
      );
  
      // Validate subjects
      await this.validateSubjects(
        connection,
        createDto.subjects.map(s => s.subject)
      );
  
      // Convert IDs to ObjectId
      const examData = {
        ...createDto,
        examType: Types.ObjectId.createFromHexString(createDto.examType),
        classId: Types.ObjectId.createFromHexString(createDto.classId),
        subjects: createDto.subjects.map(subject => ({
          ...subject,
          subject: Types.ObjectId.createFromHexString(subject.subject)
        }))
      };
  
      const exam = await repository.create(examData);
      return this.findExamById(connection, exam._id.toString());
  
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Exam already exists for this class and academic year');
      }
      throw error;
    }
  }

  async findExams(
    connection: Connection,
    query: ExamQueryDto
  ): Promise<ExamResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    const filter: any = {};
  
    if (query.academicYear) {
      filter.academicYear = query.academicYear;
    }
    if (query.classId) {
      filter.classId = Types.ObjectId.createFromHexString(query.classId);
    }
    if (query.status) {
      filter.status = query.status;
    }
  
    const exams = await repository.findWithOptions(filter, {
      populate: {
        path: 'examType classId subjects.subject',
      }
    });
  
    return ExamResponseDto.fromEntities(exams);
  }

  async findExamById(
    connection: Connection,
    id: string
  ): Promise<ExamResponseDto> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    const exam = await repository.findWithOptions(
      { _id: new Types.ObjectId(id) },
      {
        populate: {
          path: 'examType classId subjects.subject',
        }
      }
    );

    if (!exam || exam.length === 0) {
      throw new NotFoundException('Exam not found');
    }

    return ExamResponseDto.fromEntity(exam[0]);
  }

  async updateExam(
    connection: Connection,
    id: string,
    updateDto: UpdateExamDto
  ): Promise<ExamResponseDto> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      const exam = await repository.findById(id);
  
      if (!exam) {
        throw new NotFoundException('Exam not found');
      }
  
      if (exam.status !== 'Scheduled') {
        throw new BadRequestException('Only scheduled exams can be updated');
      }
  
      // Validate dates if provided
      if (updateDto.startDate || updateDto.endDate || updateDto.subjects) {
        this.validateExamDates(
          new Date(updateDto.startDate || exam.startDate),
          new Date(updateDto.endDate || exam.endDate),
          (updateDto.subjects || exam.subjects).map(s => new Date(s.examDate))
        );
      }
  
      // Validate subjects if provided
      if (updateDto.subjects) {
        await this.validateSubjects(
          connection,
          updateDto.subjects.map(s => s.subject)
        );
      }
  
      const updateData = {
        ...updateDto,
        examType: updateDto.examType ? 
          Types.ObjectId.createFromHexString(updateDto.examType) : undefined,
        classId: updateDto.classId ? 
          Types.ObjectId.createFromHexString(updateDto.classId) : undefined,
        subjects: updateDto.subjects?.map(subject => ({
          ...subject,
          subject: Types.ObjectId.createFromHexString(subject.subject)
        }))
      };
  
      await repository.findByIdAndUpdate(id, updateData);
      return this.findExamById(connection, id);
  
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Exam with these details already exists');
      }
      throw error;
    }
  }

  async deleteExam(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    const exam = await repository.findById(id);

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== 'Scheduled') {
      throw new BadRequestException('Only scheduled exams can be deleted');
    }

    return repository.delete(id);
  }

  async updateExamStatus(
    connection: Connection,
    id: string,
    status: string
  ): Promise<ExamResponseDto> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    const exam = await repository.findById(id);
  
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
  
    const validTransitions = {
      'Scheduled': ['Ongoing'],
      'Ongoing': ['Completed'],
      'Completed': ['ResultDeclared']
    };
  
    if (!validTransitions[exam.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${exam.status} to ${status}`
      );
    }
  
    await repository.findByIdAndUpdate(id, { status });
    return this.findExamById(connection, id);
  }

  async getUpcomingExams(
    connection: Connection,
    classId?: string
  ): Promise<ExamResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    const query: any = {
      status: 'Scheduled',
      startDate: { $gte: new Date() }
    };
  
    if (classId) {
      query.classId = Types.ObjectId.createFromHexString(classId);
    }
  
    const exams = await repository.findWithOptions(query, {
      populate: {
        path: 'examType classId subjects.subject',
      }
    });
  
    return ExamResponseDto.fromEntities(exams);
  }
}
