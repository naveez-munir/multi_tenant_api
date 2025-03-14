import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { BaseService } from '../../../common/services/base.service';
import { ExamResult, examResultSchema } from '../schemas/exam-result.schema';
import { ExamResultQueryDto } from '../dto/result/exam-result-query.dto';
import { CreateExamResultDto } from '../dto/result/create-result.dto';
import { ExamSchema } from '../schemas/exam.schema';
import { StudentSchema } from '../../student/schemas/student.schema';
import { SubjectSchema } from '../../subject/schemas/subject.schema';
import { ExamResultResponseDto } from '../dto/result/result-response.dto';

@Injectable()
export class ExamResultService extends BaseService<ExamResult> {
  constructor() {
    super('ExamResult', examResultSchema);
  }

  private async initializeModels(connection: Connection) {
    try {
      if (!connection.models['Exam']) {
        connection.model('Exam', ExamSchema);
      }
      if (!connection.models['Student']) {
        connection.model('Student', StudentSchema);
      }
      if (!connection.models['Subject']) {
        connection.model('Subject', SubjectSchema);
      }
    } catch (error) {
      console.error('Model initialization error:', error);
    }
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  private async validateExamAndSubjects(
    connection: Connection,
    examId: string,
    subjectResults: any[]
  ) {
    await this.initializeModels(connection);
    const examRepo = connection.model('Exam');
    const exam = await examRepo.findById(examId);
    
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== 'Completed') {
      throw new BadRequestException('Results can only be added for completed exams');
    }

    const examSubjects = new Set(exam.subjects.map(s => s.subject.toString()));
    const resultSubjects = new Set(subjectResults.map(s => s.subject));
    
    if (examSubjects.size !== resultSubjects.size) {
      throw new BadRequestException('Subject results do not match exam subjects');
    }

    for (const result of subjectResults) {
      const examSubject = exam.subjects.find(s => 
        s.subject.toString() === result.subject
      );
      
      if (!examSubject) {
        throw new BadRequestException(`Invalid subject: ${result.subject}`);
      }

      if (result.maxMarks !== examSubject.maxMarks) {
        throw new BadRequestException(`Invalid max marks for subject: ${result.subject}`);
      }

      if (result.marksObtained > examSubject.maxMarks) {
        throw new BadRequestException(`Marks obtained cannot exceed max marks for subject: ${result.subject}`);
      }
    }

    return exam;
  }

  async createResult(
    connection: Connection,
    createDto: CreateExamResultDto
  ): Promise<ExamResultResponseDto> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);

    // Validate exam and subjects
    await this.validateExamAndSubjects(
      connection,
      createDto.examId,
      createDto.subjectResults
    );

    // Calculate total marks and percentage
    const totalMarksObtained = createDto.subjectResults.reduce(
      (sum, result) => sum + result.marksObtained, 0
    );
    
    const totalMaxMarks = createDto.subjectResults.reduce(
      (sum, result) => sum + result.maxMarks, 0
    );

    const percentage = (totalMarksObtained / totalMaxMarks) * 100;

    const resultData = {
      ...createDto,
      examId: new Types.ObjectId(createDto.examId),
      studentId: new Types.ObjectId(createDto.studentId),
      subjectResults: createDto.subjectResults.map(result => ({
        ...result,
        subject: new Types.ObjectId(result.subject)
      })),
      totalMarks: totalMarksObtained,
      percentage: Number(percentage.toFixed(2)),
      grade: this.calculateGrade(percentage)
    };

    const result = await repository.create(resultData);
    return this.findResultById(connection, result._id.toString());
  }

  async findResults(
    connection: Connection,
    query: ExamResultQueryDto
  ): Promise<ExamResultResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    const filter: any = {};

    if (query.examId) {
      filter.examId = new Types.ObjectId(query.examId);
    }
    if (query.studentId) {
      filter.studentId = new Types.ObjectId(query.studentId);
    }

    if (query.classId || query.academicYear || query.examType) {
      const examRepo = connection.model('Exam');
      const examFilter: any = {};

      if (query.classId) {
        examFilter.classId = new Types.ObjectId(query.classId);
      }
      if (query.academicYear) {
        examFilter.academicYear = query.academicYear;
      }
      if (query.examType) {
        examFilter.examType = new Types.ObjectId(query.examType);
      }

      const exams = await examRepo.find(examFilter);
      filter.examId = { $in: exams.map(e => e._id) };
    }

    const results = await repository.findWithOptions(filter, {
      populate: { 
        path: 'examId studentId subjectResults.subject'
      }
    });

    return results.map(result => ExamResultResponseDto.fromEntity(result));
  }

  async findResultById(
    connection: Connection,
    id: string
  ): Promise<ExamResultResponseDto> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    
    const results = await repository.findWithOptions(
      { _id: new Types.ObjectId(id) },
      {
        populate: { 
          path: 'examId studentId subjectResults.subject'
        }
      }
    );

    if (!results || results.length === 0) {
      throw new NotFoundException('Result not found');
    }

    return ExamResultResponseDto.fromEntity(results[0]);
  }

  async findStudentResults(
    connection: Connection,
    studentId: string
  ): Promise<ExamResultResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    
    const results = await repository.findWithOptions(
      { studentId: new Types.ObjectId(studentId) },
      {
        populate: { 
          path: 'examId studentId subjectResults.subject'
        }
      }
    );

    return results.map(result => ExamResultResponseDto.fromEntity(result));
  }

  async findExamResults(
    connection: Connection,
    examId: string
  ): Promise<ExamResultResponseDto[]> {
    return this.findResults(connection, { examId });
  }

  async generateClassRanks(
    connection: Connection,
    examId: string
  ): Promise<ExamResultResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    
    const results = await repository.findWithOptions(
      { examId: new Types.ObjectId(examId) },
      {
        populate: { 
          path: 'examId studentId subjectResults.subject'
        }
      }
    );

    // Sort results by percentage
    results.sort((a, b) => b.percentage - a.percentage);

    // Assign ranks
    let currentRank = 1;
    let prevPercentage = null;
    
    const updatedResults = [];
    for (const result of results) {
      if (prevPercentage !== null && result.percentage !== prevPercentage) {
        currentRank++;
      }
      prevPercentage = result.percentage;
      
      await repository.findByIdAndUpdate(
        result._id.toString(), 
        { rank: currentRank }
      );

      const resultWithRank = { ...result, rank: currentRank };
      updatedResults.push(ExamResultResponseDto.fromEntity(resultWithRank));
    }

    return updatedResults;
  }
}
