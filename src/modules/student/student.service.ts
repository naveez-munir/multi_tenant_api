import { Injectable } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Student, StudentSchema } from './schemas/student.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SearchStudentDto } from './dto/search-student.dto';
import { ClassSchema } from '../class/schemas/class.schema';
import { StudentListResponseDto } from './dto/student-list-response.dto';

@Injectable()
export class StudentService extends BaseService<Student> {
  constructor() {
    super('Student', StudentSchema);
  }

  private async initializeModels(connection: Connection) {
    try {
      if (!connection.models['Class']) {
        connection.model('Class', ClassSchema);
      }
    } catch (error) {
      console.error('Model initialization error:', error);
    }
  }

  async createStudent(
    connection: Connection,
    createDto: CreateStudentDto
  ): Promise<StudentListResponseDto> {
    try {
      const repository = this.getRepository(connection);
      await this.initializeModels(connection);
      
      const student = await repository.create(createDto);
      const populatedStudent = await repository.findWithOptions(
        { _id: student._id },
        { populate: { path: 'class', select: 'className' } }
      );

      return StudentListResponseDto.fromEntity(populatedStudent[0]);
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async searchStudents(
    connection: Connection,
    searchDto: SearchStudentDto
  ): Promise<StudentListResponseDto[]> {
    try {
      const repository = this.getRepository(connection);
      const query: any = {};

      if (searchDto.firstName) {
        query.firstName = { $regex: searchDto.firstName, $options: 'i' };
      }
      if (searchDto.lastName) {
        query.lastName = { $regex: searchDto.lastName, $options: 'i' };
      }
      if (searchDto.cniNumber) {
        query.cniNumber = searchDto.cniNumber;
      }
      if (searchDto.guardianCnic) {
        query['guardian.cniNumber'] = searchDto.guardianCnic;
      }
      if (searchDto.gradeLevel) {
        query.gradeLevel = searchDto.gradeLevel;
      }
      if (searchDto.status) {
        query.status = searchDto.status;
      }
      if (searchDto.section) {
        query.section = new Types.ObjectId(searchDto.section);
      }
  
      await this.initializeModels(connection);
      
      const students = await repository.findWithOptions(query, {
        populate: {
          path: 'class',
          select: 'className'
        },
        sort: { gradeLevel: 1, firstName: 1, lastName: 1 }
      });

      return students.map(student => StudentListResponseDto.fromEntity(student));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateStudentById(
    connection: Connection,
    id: string,
    updateDto: UpdateStudentDto
  ): Promise<StudentListResponseDto> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    
    await repository.findByIdAndUpdate(id, updateDto);
    
    const updatedStudent = await repository.findWithOptions(
      { _id: new Types.ObjectId(id) },
      { populate: { path: 'class', select: 'className' } }
    );

    return StudentListResponseDto.fromEntity(updatedStudent[0]);
  }

  async addDocument(
    connection: Connection,
    studentId: string,
    document: { documentType: string; documentUrl: string }
  ): Promise<StudentListResponseDto> {
    const repository = this.getRepository(connection);
    const student = await repository.findById(studentId);
    if (!student) throw new Error('Student not found');
    
    const documents = student.documents || [];
    documents.push({ ...document, uploadDate: new Date() });

    await repository.findByIdAndUpdate(studentId, { documents });
    
    const updatedStudent = await repository.findWithOptions(
      { _id: new Types.ObjectId(studentId) },
      { populate: { path: 'class', select: 'className' } }
    );

    return StudentListResponseDto.fromEntity(updatedStudent[0]);
  }

  async updateAttendance(
    connection: Connection,
    studentId: string,
    percentage: number
  ): Promise<StudentListResponseDto> {
    const repository = this.getRepository(connection);
    await repository.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
    
    const updatedStudent = await repository.findWithOptions(
      { _id: new Types.ObjectId(studentId) },
      { populate: { path: 'class', select: 'className' } }
    );

    return StudentListResponseDto.fromEntity(updatedStudent[0]);
  }

  async getStudentsByClass(
    connection: Connection,
    gradeLevel: string,
    sectionId?: string
  ): Promise<StudentListResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    const query: any = { gradeLevel };
    
    if (sectionId) {
      query.section = new Types.ObjectId(sectionId);
    }

    const students = await repository.findWithOptions(query, {
      populate: {
        path: 'class',
        select: 'className'
      },
      sort: { firstName: 1, lastName: 1 }
    });

    return students.map(student => StudentListResponseDto.fromEntity(student));
  }

  async getStudentsByGuardianCnic(
    connection: Connection,
    guardianCnic: string
  ): Promise<StudentListResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    
    const students = await repository.findWithOptions(
      { 'guardian.cniNumber': guardianCnic },
      {
        populate: {
          path: 'class',
          select: 'className'
        },
        sort: { firstName: 1, lastName: 1 }
      }
    );

    return students.map(student => StudentListResponseDto.fromEntity(student));
  }

  async updateStudentStatus(
    connection: Connection,
    studentId: string,
    status: string,
    exitDetails?: {
      exitStatus: string;
      exitDate: Date;
      exitRemarks?: string;
    }
  ): Promise<StudentListResponseDto> {
    const repository = this.getRepository(connection);
    const updateData: any = { status };

    if (exitDetails) {
      Object.assign(updateData, exitDetails);
    }

    await repository.findByIdAndUpdate(studentId, updateData);
    
    const updatedStudent = await repository.findWithOptions(
      { _id: new Types.ObjectId(studentId) },
      { populate: { path: 'class', select: 'className' } }
    );

    return StudentListResponseDto.fromEntity(updatedStudent[0]);
  }

  // Keep getById with full student details
  async findById(
    connection: Connection,
    id: string
  ): Promise<Student | null> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      
      const students = await repository.findWithOptions(
        { _id: new Types.ObjectId(id) },
        {
          populate: {
            path: 'class',
            select: 'className section classGradeLevel classTeacher classTempTeacher classSubjects'
          }
        }
      );
  
      if (!students || students.length === 0) {
        return null;
      }
  
      return students[0];
    } catch (error) {
      console.error('Error finding student by ID:', error);
      throw error;
    }
  }
}
