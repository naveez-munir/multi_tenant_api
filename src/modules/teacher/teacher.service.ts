import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Teacher, TeacherSchema } from './schemas/teacher.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateTeacherDto, DocumentDto, EducationHistoryDto, ExperienceDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherListResponseDto } from './dto/teacher-list-response.dto';
import { ClassSchema } from '../class/schemas/class.schema';
import { SearchTeacherDto } from './dto/search-student.dto';

@Injectable()
export class TeacherService extends BaseService<Teacher> {
  constructor() {
    super('Teacher', TeacherSchema);
  }

  private async initializeModels(connection: Connection): Promise<void> {
    try {
      if (!connection.models['Class']) {
        connection.model('Class', ClassSchema);
      }
    } catch (error) {
      // Model already exists, ignore error
    }
  }

  private validateObjectId(id: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName} ID format`);
    }
  }

  async createTeacher(
    connection: Connection, 
    createDto: CreateTeacherDto
  ): Promise<TeacherListResponseDto> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);

      const teacherData = {
        ...createDto,
        ...(createDto.classTeacherOf && {
          classTeacherOf: new Types.ObjectId(createDto.classTeacherOf.toString())
        }),
        ...(createDto.userId && {
          userId: new Types.ObjectId(createDto.userId.toString())
        })
      };

      const newTeacher = await repository.create(teacherData);
      const populatedTeacher = await repository.findWithOptions(
        { _id: newTeacher._id },
        {
          populate: {
            path: 'classTeacherOf',
            select: 'className'
          }
        }
      );

      return TeacherListResponseDto.fromEntity(populatedTeacher[0]);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('A teacher with this CNI Number or Email already exists');
      }
      throw error;
    }
  }

  async searchTeachers(
    connection: Connection, 
    searchDto: SearchTeacherDto
  ) {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      const query: Record<string, any> = {};

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
        this.validateObjectId(searchDto.classTeacherOf, 'class');
        query.classTeacherOf = new Types.ObjectId(searchDto.classTeacherOf);
      }
      if (searchDto.qualification) {
        query.qualifications = { $regex: searchDto.qualification, $options: 'i' };
      }
      if (searchDto.gender) {
        query.gender = searchDto.gender;
      }

      const teachers = await repository.findWithOptions(query, {
        populate: {
          path: 'classTeacherOf',
          select: 'className'
        },
        sort: { firstName: 1, lastName: 1 }
      });
      return teachers.map(teacher => TeacherListResponseDto.fromEntity(teacher));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to search teachers');
    }
  }

  async findById(
    connection: Connection,
    id: string
  ): Promise<Teacher> {
    try {
      this.validateObjectId(id, 'teacher');
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);

      const teacher = await repository.findWithOptions(
        { _id: new Types.ObjectId(id) },
        {
          populate: {
            path: 'classTeacherOf userId',
            select: 'className email'
          }
        }
      );

      if (!teacher || !teacher.length) {
        throw new NotFoundException('Teacher not found');
      }

      return teacher[0];
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch teacher');
    }
  }

  async updateTeacherById(
    connection: Connection,
    id: string,
    updateDto: UpdateTeacherDto
  ): Promise<TeacherListResponseDto> {
    try {
      this.validateObjectId(id, 'teacher');
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      const updateData = {
        ...updateDto,
        ...(updateDto.classTeacherOf && {
          classTeacherOf: new Types.ObjectId(updateDto.classTeacherOf._id.toString())
        }),
        ...(updateDto.userId && {
          userId: new Types.ObjectId(updateDto.userId.toString())
        })
      };

      await repository.findByIdAndUpdate(id, updateData);

      const updatedTeacher = await repository.findWithOptions(
        { _id: new Types.ObjectId(id) },
        {
          populate: {
            path: 'classTeacherOf',
            select: 'className'
          }
        }
      );

      if (!updatedTeacher || !updatedTeacher.length) {
        throw new NotFoundException('Teacher not found');
      }

      return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
    } catch (error) {
      console.log(error)
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update teacher');
    }
  }

  async assignTeacherToClass(
    connection: Connection,
    teacherId: string,
    classId: string
  ): Promise<TeacherListResponseDto> {
    try {
      this.validateObjectId(teacherId, 'teacher');
      this.validateObjectId(classId, 'class');
      
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);

      const existingClassTeacher = await repository.findOne({ 
        classTeacherOf: new Types.ObjectId(classId) 
      });

      if (existingClassTeacher) {
        throw new ConflictException('This class already has a teacher assigned');
      }

      await repository.findByIdAndUpdate(teacherId, { 
        classTeacherOf: new Types.ObjectId(classId) 
      });

      const updatedTeacher = await repository.findWithOptions(
        { _id: new Types.ObjectId(teacherId) },
        {
          populate: {
            path: 'classTeacherOf',
            select: 'className'
          }
        }
      );

      return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign teacher to class');
    }
  }

  async addEducationHistory(
    connection: Connection,
    teacherId: string,
    education: EducationHistoryDto
  ): Promise<TeacherListResponseDto> {
    try {
      this.validateObjectId(teacherId, 'teacher');
      const repository = this.getRepository(connection);
      
      const teacher = await repository.findById(teacherId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const educationHistory = teacher.educationHistory || [];
      educationHistory.push(education);

      await repository.findByIdAndUpdate(teacherId, { educationHistory });

      const updatedTeacher = await repository.findWithOptions(
        { _id: new Types.ObjectId(teacherId) },
        {
          populate: {
            path: 'classTeacherOf',
            select: 'className'
          }
        }
      );

      return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add education history');
    }
  }

  async addExperience(
    connection: Connection,
    teacherId: string,
    experience: ExperienceDto
  ): Promise<TeacherListResponseDto> {
    try {
      this.validateObjectId(teacherId, 'teacher');
      const repository = this.getRepository(connection);
      
      const teacher = await repository.findById(teacherId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const experienceList = teacher.experience || [];
      experienceList.push(experience);

      await repository.findByIdAndUpdate(teacherId, { experience: experienceList });

      const updatedTeacher = await repository.findWithOptions(
        { _id: new Types.ObjectId(teacherId) },
        {
          populate: {
            path: 'classTeacherOf',
            select: 'className'
          }
        }
      );

      return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add experience');
    }
  }

  async addDocument(
    connection: Connection,
    teacherId: string,
    document: DocumentDto
  ): Promise<TeacherListResponseDto> {
    try {
      this.validateObjectId(teacherId, 'teacher');
      const repository = this.getRepository(connection);
      
      const teacher = await repository.findById(teacherId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const documents = teacher.documents || [];
      documents.push({ ...document, uploadDate: new Date() });

      await repository.findByIdAndUpdate(teacherId, { documents });

      const updatedTeacher = await repository.findWithOptions(
        { _id: new Types.ObjectId(teacherId) },
        {
          populate: {
            path: 'classTeacherOf',
            select: 'className'
          }
        }
      );

      return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add document');
    }
  }

  async updateTeacherStatus(
    connection: Connection,
    teacherId: string,
    employmentStatus: string
  ): Promise<TeacherListResponseDto> {
    try {
      this.validateObjectId(teacherId, 'teacher');
      const repository = this.getRepository(connection);

      await repository.findByIdAndUpdate(teacherId, { employmentStatus });

      const updatedTeacher = await repository.findWithOptions(
        { _id: new Types.ObjectId(teacherId) },
        {
          populate: {
            path: 'classTeacherOf',
            select: 'className'
          }
        }
      );

      if (!updatedTeacher || !updatedTeacher.length) {
        throw new NotFoundException('Teacher not found');
      }

      return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update teacher status');
    }
  }

  async deleteTeacher(
    connection: Connection,
    teacherId: string
  ): Promise<boolean> {
    try {
      this.validateObjectId(teacherId, 'teacher');
      const repository = this.getRepository(connection);
      
      const result = await repository.delete(teacherId);
      if (!result) {
        throw new NotFoundException('Teacher not found');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete teacher');
    }
  }
}
