import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Student, StudentSchema } from './schemas/student.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SearchStudentDto } from './dto/search-student.dto';
import { ClassSchema } from '../class/schemas/class.schema';
import { StudentListResponseDto } from './dto/student-list-response.dto';
import { Counter, CounterSchema } from 'src/common/schemas/counter.schema';
import { GuardianSchema } from './schemas/guardian.schema';

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
      if (!connection.models['Counter']) {
        connection.model('Counter', CounterSchema);
      }
      if (!connection.models['Guardian']) {
        connection.model('Guardian', GuardianSchema);
      }
    } catch (error) {
      console.error('Model initialization error:', error);
      throw new BadRequestException('Failed to initialize database models');
    }
  }

  private async getNextSequence(connection: Connection, sequenceName: string): Promise<number> {
    try {
      const CounterModel = connection.model('Counter', CounterSchema);
      let counter = await CounterModel.findOne({ name: sequenceName });
    
      if (!counter) {
        counter = await CounterModel.create({
          name: sequenceName,
          seq: 10000
        });
      }
      
      counter = await CounterModel.findOneAndUpdate(
        { name: sequenceName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      return counter.seq;
    } catch (error) {
      console.error('Error generating sequence number:', error);
      throw new BadRequestException('Failed to generate roll number');
    }
  }

  private prepareStudentData(studentDto: CreateStudentDto | UpdateStudentDto): Record<string, any> {
    const studentData: Record<string, any> = { ...studentDto };
    delete studentData.guardian;
    delete studentData.guardianId;
    return studentData;
  }

  async createStudent(
    connection: Connection,
    createDto: CreateStudentDto
  ): Promise<StudentListResponseDto> {
    try {
      const repository = this.getRepository(connection);
      await this.initializeModels(connection);

      const existingStudent = await repository.findOne({ cniNumber: createDto.cniNumber });
      if (existingStudent) {
        throw new BadRequestException(`Student with CNIC ${createDto.cniNumber} already exists`);
      }

      let guardianId = null;
      if (createDto.guardian) {
        const GuardianModel = connection.model('Guardian');
        let guardian = await GuardianModel.findOne({ cniNumber: createDto.guardian.cniNumber });
        if (!guardian) {
          guardian = await GuardianModel.create({
            name: createDto.guardian.name,
            cniNumber: createDto.guardian.cniNumber,
            relationship: createDto.guardian.relationship,
            phone: createDto.guardian.phone,
            email: createDto.guardian.email,
            students: [],
          });
        }
        guardianId = guardian._id;
      } else if (createDto.guardianId) {
        guardianId = createDto.guardianId;
      }
      const studentData = this.prepareStudentData(createDto);
      if (guardianId) {
        studentData.guardian = guardianId;
      }
      const student = await repository.create(studentData);
      try {
        const nextRollNumber = await this.getNextSequence(connection, 'studentRollNumber');
        await repository.findByIdAndUpdate(student._id.toString(), { 
          rollNumber: nextRollNumber.toString() 
        });
      } catch (rollNumberError) {
        console.error('Failed to generate roll number:', rollNumberError);
      }
      if (guardianId) {
        const GuardianModel = connection.model('Guardian', GuardianSchema);
        await GuardianModel.findByIdAndUpdate(guardianId, {
          $addToSet: { students: student._id }
        });
      }

      const populatedStudent = await repository.findWithOptions(
        { _id: student._id },
        { populate: { path: 'class', select: 'className' } }
      );

      return StudentListResponseDto.fromEntity(populatedStudent[0]);
    } catch (error) {
      console.error('Error creating student:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create student: ' + error.message);
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
      if (searchDto.guardianId) {
        query.guardian = new Types.ObjectId(searchDto.guardianId);
      } else if (searchDto.guardianCnic) {
        await this.initializeModels(connection);
        const GuardianModel = connection.model('Guardian', GuardianSchema);
        const guardian = await GuardianModel.findOne({ cniNumber: searchDto.guardianCnic });
        if (guardian) {
          query.guardian = guardian._id;
        } else {
          return [];
        }
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
      console.error('Error searching students:', error);
      throw new BadRequestException('Failed to search students: ' + error.message);
    }
  }

  async updateStudentById(
    connection: Connection,
    id: string,
    updateDto: UpdateStudentDto
  ): Promise<StudentListResponseDto> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);

      const existingStudent = await repository.findById(id);
      if (!existingStudent) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      if (updateDto.status && ['Graduated', 'Expelled', 'Withdrawn'].includes(updateDto.status)) {
        if (!updateDto.exitStatus || !updateDto.exitDate) {
          throw new BadRequestException(
            'Exit status and exit date are required when status is Graduated, Expelled, or Withdrawn'
          );
        }
      }
      const studentData = this.prepareStudentData(updateDto);
      if (updateDto.guardianId) {
        studentData.guardian = new Types.ObjectId(updateDto.guardianId.toString());
      }
      await repository.findByIdAndUpdate(id, studentData);

      const updatedStudent = await repository.findWithOptions(
        { _id: new Types.ObjectId(id) },
        { populate: { path: 'class', select: 'className' } }
      );

      return StudentListResponseDto.fromEntity(updatedStudent[0]);
    } catch (error) {
      console.error('Error updating student:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update student: ' + error.message);
    }
  }

  async addDocument(
    connection: Connection,
    studentId: string,
    document: { documentType: string; documentUrl: string }
  ): Promise<StudentListResponseDto> {
    try {
      const repository = this.getRepository(connection);
      const student = await repository.findById(studentId);
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }
      
      const documents = student.documents || [];
      documents.push({ ...document, uploadDate: new Date() });

      await repository.findByIdAndUpdate(studentId, { documents });
      
      const updatedStudent = await repository.findWithOptions(
        { _id: new Types.ObjectId(studentId) },
        { populate: { path: 'class', select: 'className' } }
      );

      return StudentListResponseDto.fromEntity(updatedStudent[0]);
    } catch (error) {
      console.error('Error adding document:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to add document: ' + error.message);
    }
  }

  async updateAttendance(
    connection: Connection,
    studentId: string,
    percentage: number
  ): Promise<StudentListResponseDto> {
    try {
      const repository = this.getRepository(connection);
      const student = await repository.findById(studentId);
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }
      
      await repository.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
      
      const updatedStudent = await repository.findWithOptions(
        { _id: new Types.ObjectId(studentId) },
        { populate: { path: 'class', select: 'className' } }
      );

      return StudentListResponseDto.fromEntity(updatedStudent[0]);
    } catch (error) {
      console.error('Error updating attendance:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update attendance: ' + error.message);
    }
  }

  async getStudentsByClass(
    connection: Connection,
    gradeLevel: string,
    sectionId?: string
  ): Promise<StudentListResponseDto[]> {
    try {
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
    } catch (error) {
      console.error('Error getting students by class:', error);
      throw new BadRequestException('Failed to get students by class: ' + error.message);
    }
  }

  async getStudentsByGuardianCnic(
    connection: Connection,
    guardianCnic: string
  ): Promise<StudentListResponseDto[]> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      const GuardianModel = connection.model('Guardian', GuardianSchema);
      const guardian = await GuardianModel.findOne({ cniNumber: guardianCnic });
      if (!guardian) {
        return [];
      }
      const students = await repository.findWithOptions(
        { guardian: guardian._id },
        {
          populate: {
            path: 'class',
            select: 'className'
          },
          sort: { firstName: 1, lastName: 1 }
        }
      );

      return students.map(student => StudentListResponseDto.fromEntity(student));
    } catch (error) {
      console.error('Error getting students by guardian CNIC:', error);
      throw new BadRequestException('Failed to get students by guardian CNIC: ' + error.message);
    }
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
    try {
      const repository = this.getRepository(connection);
      const student = await repository.findById(studentId);
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }
      if (['Graduated', 'Expelled', 'Withdrawn'].includes(status) && !exitDetails) {
        throw new BadRequestException(
          'Exit details are required when status is Graduated, Expelled, or Withdrawn'
        );
      }
      
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
    } catch (error) {
      console.error('Error updating student status:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update student status: ' + error.message);
    }
  }

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
            path: 'class guardian',
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
      throw new BadRequestException('Failed to find student: ' + error.message);
    }
  }
  
  async delete(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    try {
      const repository = this.getRepository(connection);
      const student = await repository.findById(id);
      if (!student) {
        return false;
      }

      if (student.guardian) {
        await this.initializeModels(connection);
        const GuardianModel = connection.model('Guardian', GuardianSchema);
        await GuardianModel.findByIdAndUpdate(student.guardian, {
          $pull: { students: student._id }
        });
      }
      
      return await repository.delete(id);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw new BadRequestException('Failed to delete student: ' + error.message);
    }
  }
}
