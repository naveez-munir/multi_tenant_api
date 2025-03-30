import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Student, StudentSchema } from './schemas/student.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SearchStudentDto } from './dto/search-student.dto';
import { StudentListResponseDto } from './dto/student-list-response.dto';
import { MongoDbUtils } from '../../common/utils/mongodb.utils';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { QueryBuilderService } from '../../common/services/query-builder.service';
import { GuardianSchema } from './schemas/guardian.schema';

@Injectable()
export class StudentService extends BaseService<Student> {
  constructor(
    private sequenceGenerator: SequenceGeneratorService,
    private queryBuilder: QueryBuilderService
  ) {
    super('Student', StudentSchema);
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
    const repository = this.getRepository(connection);

    const existingStudent = await repository.findOne({ cniNumber: createDto.cniNumber });
    if (existingStudent) {
      throw new BadRequestException(`Student with CNIC ${createDto.cniNumber} already exists`);
    }

    let guardianId: Types.ObjectId | null = null;
    if (createDto.guardian) {
      const GuardianModel = connection.model('Guardian', GuardianSchema);
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
      guardianId = MongoDbUtils.validateId(createDto.guardianId.toString(), 'Guardian');
    }

    const studentData = this.prepareStudentData(createDto);
    if (guardianId) {
      studentData.guardian = guardianId;
    }
    const student = await repository.create(studentData);

    try {
      const nextRollNumber = await this.sequenceGenerator.getNextSequence(
        connection, 
        'studentRollNumber'
      );
      await repository.findByIdAndUpdate(student._id.toString(), { 
        rollNumber: nextRollNumber.toString() 
      });
    } catch (rollNumberError) {
      console.error('Failed to generate roll number:', rollNumberError);
    }

    if (guardianId) {
      const GuardianModel = connection.model('Guardian');
      await GuardianModel.findByIdAndUpdate(guardianId.toString(), {
        $addToSet: { students: student._id }
      });
    }

    const populatedStudent = await repository.findWithOptions(
      { _id: student._id },
      { populate: { path: 'class', select: 'className' } }
    );

    return StudentListResponseDto.fromEntity(populatedStudent[0]);
  }

  async searchStudents(
    connection: Connection,
    searchDto: SearchStudentDto
  ): Promise<StudentListResponseDto[]> {
    const repository = this.getRepository(connection);
    const query = this.queryBuilder.buildStudentSearchQuery(searchDto);

    if (searchDto.guardianCnic) {
      const GuardianModel = connection.model('Guardian');
      const guardian = await GuardianModel.findOne({ cniNumber: searchDto.guardianCnic });
      if (guardian) {
        query.guardian = guardian._id;
      } else {
        return [];
      }
    }

    const students = await repository.findWithOptions(query, {
      populate: { 
        path: 'class guardian', 
        select: 'className' 
      },
      sort: { gradeLevel: 1, firstName: 1, lastName: 1 }
    });

    return students.map(student => StudentListResponseDto.fromEntity(student));
  }

  async updateStudentById(
    connection: Connection,
    id: string,
    updateDto: UpdateStudentDto
  ): Promise<StudentListResponseDto> {
    const repository = this.getRepository(connection);
    const objectId = MongoDbUtils.validateId(id, 'Student');

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
    if (updateDto.guardian) {
      const GuardianModel = connection.model('Guardian', GuardianSchema);
      let guardian = await GuardianModel.findOne({ cniNumber: updateDto.guardian.cniNumber });
      
      if (guardian) {
        await GuardianModel.findByIdAndUpdate(guardian._id, {
          name: updateDto.guardian.name,
          relationship: updateDto.guardian.relationship,
          phone: updateDto.guardian.phone,
          email: updateDto.guardian.email,
        });
      }
    }

    const studentData = this.prepareStudentData(updateDto);
    if (updateDto.guardianId) {
      studentData.guardian = MongoDbUtils.validateId(updateDto.guardianId.toString(), 'Guardian');
    }
    await repository.findByIdAndUpdate(id, studentData);

    const updatedStudent = await repository.findWithOptions(
      { _id: objectId },
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
    const objectId = MongoDbUtils.validateId(studentId, 'Student');
    
    const student = await repository.findById(studentId);
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }
    
    const documents = student.documents || [];
    documents.push({ ...document, uploadDate: new Date() });

    await repository.findByIdAndUpdate(studentId, { documents });
    
    const updatedStudent = await repository.findWithOptions(
      { _id: objectId },
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
    const objectId = MongoDbUtils.validateId(studentId, 'Student');
    
    const student = await repository.findById(studentId);
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }
    
    await repository.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
    
    const updatedStudent = await repository.findWithOptions(
      { _id: objectId },
      { populate: { path: 'class', select: 'className' } }
    );

    return StudentListResponseDto.fromEntity(updatedStudent[0]);
  }

  async getStudentsByClass(
    connection: Connection,
    gradeLevel: string,
    sectionId?: string
  ): Promise<StudentListResponseDto[]> {
    const repository = this.getRepository(connection);
    const query: any = { gradeLevel };
    
    if (sectionId) {
      query.section = MongoDbUtils.validateId(sectionId, 'Section');
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
    if (!guardianCnic) {
      throw new BadRequestException('Guardian CNIC is required');
    }

    const repository = this.getRepository(connection);
    const GuardianModel = connection.model('Guardian');
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
    const objectId = MongoDbUtils.validateId(studentId, 'Student');
    
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
      { _id: objectId },
      { populate: { path: 'class', select: 'className' } }
    );

    return StudentListResponseDto.fromEntity(updatedStudent[0]);
  }

  async findById(
    connection: Connection,
    id: string
  ): Promise<Student | null> {
    const repository = this.getRepository(connection);
    const objectId = MongoDbUtils.validateId(id, 'Student');
    
    const students = await repository.findWithOptions(
      { _id: objectId },
      {
        populate: {
          path: 'class guardian',
          select: 'className section classGradeLevel classTeacher classTempTeacher classSubjects guardian name cniNumber relationship phone email'
        }
      }
    );

    if (!students || students.length === 0) {
      return null;
    }

    return students[0];
  }
  
  async delete(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    const objectId = MongoDbUtils.validateId(id, 'Student');
    
    const student = await repository.findById(id);
    if (!student) {
      return false;
    }

    if (student.guardian) {
      const GuardianModel = connection.model('Guardian');
      await GuardianModel.findByIdAndUpdate(student.guardian.toString(), {
        $pull: { students: student._id }
      });
    }
    
    return await repository.delete(id);
  }
}
