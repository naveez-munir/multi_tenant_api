import { Injectable } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Student, StudentSchema } from './schemas/student.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SearchStudentDto } from './dto/search-student.dto';
import { ClassSchema } from '../class/schemas/class.schema';

@Injectable()
export class StudentService extends BaseService<Student> {
  constructor() {
    super('Student', StudentSchema);
  }

  private async initializeModels(connection: Connection) {
      try {
        // Initialize required models if they don't exist
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
  ) {
    try {
      const repository = this.getRepository(connection);
      const result = await repository.create(createDto);
      return result;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async searchStudents(
    connection: Connection,
    searchDto: SearchStudentDto
  ): Promise<Student[]> {
    try {
      const repository = this.getRepository(connection);
      const query: any = {};
  
      // Build query based on search criteria
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
      return repository.findWithOptions(query,{
        populate:{
          path: 'class '
        }
      });
    } catch (error) {
      console.log(error)
    }
  }

  async updateStudentById(
    connection: Connection,
    id: string,
    updateDto: UpdateStudentDto
  ): Promise<Student | null> {
    const repository = this.getRepository(connection);
    return repository.findByIdAndUpdate(id, updateDto);
  }

  async addDocument(
    connection: Connection,
    studentId: string,
    document: { documentType: string; documentUrl: string }
  ): Promise<Student | null> {
    const repository = this.getRepository(connection);
    const student = await repository.findById(studentId);
    if (!student) return null;
    const documents = student.documents || [];
    documents.push({ ...document, uploadDate: new Date() });

    return repository.findByIdAndUpdate(studentId, { documents });
  }

  async updateAttendance(
    connection: Connection,
    studentId: string,
    percentage: number
  ): Promise<Student | null> {
    const repository = this.getRepository(connection);
    return repository.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
  }

  async getStudentsByClass(
    connection: Connection,
    gradeLevel: string,
    sectionId?: string
  ): Promise<Student[]> {
    const repository = this.getRepository(connection);
    const query: any = { gradeLevel };
    
    if (sectionId) {
      query.section = new Types.ObjectId(sectionId);
    }

    return repository.find(query);
  }

  async getStudentsByGuardianCnic(
    connection: Connection,
    guardianCnic: string
  ): Promise<Student[]> {
    const repository = this.getRepository(connection);
    return repository.find({ 'guardian.cniNumber': guardianCnic });
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
  ): Promise<Student | null> {
    const repository = this.getRepository(connection);
    const updateData: any = { status };

    if (exitDetails) {
      Object.assign(updateData, exitDetails);
    }

    return repository.findByIdAndUpdate(studentId, updateData);
  }
}
