import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Teacher, TeacherSchema } from './schemas/teacher.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { SearchTeacherDto } from './dto/search-student.dto';

@Injectable()
export class TeacherService extends BaseService<Teacher> {
  constructor() {
    super('Teacher', TeacherSchema);
  }

  // ✅ Create a Teacher in the Tenant-Specific Database
  async createTeacher(connection: Connection, createDto: CreateTeacherDto): Promise<Teacher> {
    try {
      const repository = this.getRepository(connection);

      // Convert ObjectId fields
      if (createDto.classTeacherOf && typeof createDto.classTeacherOf === 'string') {
        createDto.classTeacherOf = new Types.ObjectId(createDto.classTeacherOf);
      }
      if (createDto.userId && typeof createDto.userId === 'string') {
        createDto.userId = new Types.ObjectId(createDto.userId);
      }

      return await repository.create(createDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('A teacher with this CNI Number or Email already exists');
      }
      throw error;
    }
  }

  // ✅ Search Teachers with Filters
  async searchTeachers(connection: Connection, searchDto: SearchTeacherDto): Promise<Teacher[]> {
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
      if (searchDto.employmentStatus) {
        query.employmentStatus = searchDto.employmentStatus;
      }
      if (searchDto.classTeacherOf) {
        query.classTeacherOf = new Types.ObjectId(searchDto.classTeacherOf);
      }
      if (searchDto.qualification) {
        query.qualifications = { $regex: searchDto.qualification, $options: 'i' };
      }

      return repository.find(query);
    } catch (error) {
      console.error('Error searching teachers:', error);
      throw error;
    }
  }

  // ✅ Update a Teacher by ID
  async updateTeacherById(
    connection: Connection,
    id: string,
    updateDto: UpdateTeacherDto
  ): Promise<Teacher | null> {
    const repository = this.getRepository(connection);
    return repository.findByIdAndUpdate(id, updateDto);
  }

  // ✅ Assign a Teacher to a Class
  async assignTeacherToClass(connection: Connection, teacherId: string, classId: string): Promise<Teacher | null> {
    const repository = this.getRepository(connection);
    const teacherObjectId = new Types.ObjectId(teacherId);
    const classObjectId = new Types.ObjectId(classId);

    const existingClassTeacher = await repository.find({ classTeacherOf: classObjectId });
    if (existingClassTeacher.length > 0) {
      throw new ConflictException('This class already has a teacher assigned');
    }

    return repository.findByIdAndUpdate(teacherId, { classTeacherOf: classObjectId });
  }

  // ✅ Add an Education History Entry
  async addEducationHistory(
    connection: Connection,
    teacherId: string,
    education: { degree: string; institution: string; year: number; certificateUrl?: string }
  ): Promise<Teacher | null> {
    const repository = this.getRepository(connection);
    const teacher = await repository.findById(teacherId);
    if (!teacher) return null;

    const educationHistory = teacher.educationHistory || [];
    educationHistory.push(education);

    return repository.findByIdAndUpdate(teacherId, { educationHistory });
  }

  // ✅ Add an Experience Entry
  async addExperience(
    connection: Connection,
    teacherId: string,
    experience: { institution: string; position: string; fromDate: Date; toDate?: Date; description?: string; experienceLatterUrl?: string }
  ): Promise<Teacher | null> {
    const repository = this.getRepository(connection);
    const teacher = await repository.findById(teacherId);
    if (!teacher) return null;

    const experienceList = teacher.experience || [];
    experienceList.push(experience);

    return repository.findByIdAndUpdate(teacherId, { experience: experienceList });
  }

  // ✅ Add a Document (e.g., CNIC Image)
  async addDocument(
    connection: Connection,
    teacherId: string,
    document: { documentType: string; documentUrl: string }
  ): Promise<Teacher | null> {
    const repository = this.getRepository(connection);
    const teacher = await repository.findById(teacherId);
    if (!teacher) return null;

    const documents = teacher.documents || [];
    documents.push({ ...document, uploadDate: new Date() });

    return repository.findByIdAndUpdate(teacherId, { documents });
  }

  // ✅ Update Teacher Employment Status
  async updateTeacherStatus(
    connection: Connection,
    teacherId: string,
    employmentStatus: string
  ): Promise<Teacher | null> {
    const repository = this.getRepository(connection);
    return repository.findByIdAndUpdate(teacherId, { employmentStatus });
  }

  // ✅ Remove a Teacher by ID
  async deleteTeacher(connection: Connection, teacherId: string): Promise<boolean> {
    const repository = this.getRepository(connection);
    return repository.delete(teacherId);
  }
}
