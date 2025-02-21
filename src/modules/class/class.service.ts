import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Class, ClassSchema } from './schemas/class.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassListResponseDto } from './dto/class-list-response.dto';
import { TenantAwareRepository } from 'src/common/repositories/tenant-aware.repository';
import { SubjectSchema } from '../subject/schemas/subject.schema';
import { TeacherSchema } from '../teacher/schemas/teacher.schema';

@Injectable()
export class ClassService extends BaseService<Class> {
  constructor() {
    super('Class', ClassSchema);
  }

  private async makeConnection(connection: Connection): Promise<void> {
    try {
      connection.model('Subject', SubjectSchema);
      connection.model('Teacher', TeacherSchema);
    } catch (error) {
      console.log('Model initialization error:', error);
    }
  }

  private async checkTeacherAssignment(
    repository: TenantAwareRepository<Class>,
    teacherId: string,
    excludeClassId?: string
  ): Promise<void> {
    try {
      console.log('>>>>>>>>>', teacherId)
      const query: Record<string, any> = {
        classTeacher: new Types.ObjectId(teacherId)
      };
  
      if (excludeClassId) {
        query._id = { $ne: new Types.ObjectId(excludeClassId) };
      }
  
      const existingClass = await repository.findOne(query);
      if (existingClass) {
        throw new ConflictException('Teacher is already assigned to another class');
      }
    } catch (error) {
      console.log('>>>>>>', error)
    }
  }

  async createClass(
    connection: Connection,
    createDto: CreateClassDto
  ): Promise<ClassListResponseDto> {
    try {
      await this.makeConnection(connection);
      const repository = this.getRepository(connection);

      if (createDto.classTeacher) {
        await this.checkTeacherAssignment(repository, createDto.classTeacher.toString());
      }

      const classData: Partial<Class> = {
        ...createDto,
        ...(createDto.classTeacher && {
          classTeacher: new Types.ObjectId(createDto.classTeacher)
        }),
        ...(createDto.classTempTeacher && {
          classTempTeacher: new Types.ObjectId(createDto.classTempTeacher)
        }),
        ...(createDto.classSubjects && {
          classSubjects: createDto.classSubjects.map(id => new Types.ObjectId(id))
        })
      };

      const newClass = await repository.create(classData);
      const populatedClass = await repository.findWithOptions(
        { _id: newClass._id },
        {
          populate: {
            path: 'classTeacher classTempTeacher classSubjects',
            select: 'name subject'
          }
        }
      );

      return ClassListResponseDto.fromEntity(populatedClass[0]);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Class with this name and section already exists');
      }
      throw error;
    }
  }

  async findClasses(
    connection: Connection,
    filter: Record<string, any> = {}
  ): Promise<ClassListResponseDto[]> {
    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    
    const classes = await repository.findWithOptions(filter, {
      populate: {
        path: 'classTeacher classTempTeacher classSubjects',
        select: '-createdAt -updatedAt'
      }
    });
    return classes.map(classData => ClassListResponseDto.fromEntity(classData));
  }

  async findById(
    connection: Connection,
    id: string
  ): Promise<Class> {
    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    const classDoc = await repository.findWithOptions(
      { _id: new Types.ObjectId(id) },
      {
        populate: {
          path: 'classTeacher classTempTeacher classSubjects',
          select: '-createdAt -updatedAt'
        }
      }
    );

    if (!classDoc || !classDoc.length) {
      throw new NotFoundException('Class not found');
    }

    return classDoc[0];
  }

  async updateClass(
    connection: Connection,
    id: string,
    updateDto: UpdateClassDto
  ): Promise<ClassListResponseDto> {
    try {
      await this.makeConnection(connection);
      const repository = this.getRepository(connection);
  
      if (updateDto.classTeacher) {
        await this.checkTeacherAssignment(repository, updateDto.classTeacher.toString(), id);
      }
  
      // Clean up the updateDto to handle empty strings
      const updateData: Partial<Class> = {
        ...updateDto,
        classTeacher: updateDto.classTeacher ? new Types.ObjectId(updateDto.classTeacher) : undefined,
        classTempTeacher: updateDto.classTempTeacher ? new Types.ObjectId(updateDto.classTempTeacher) : undefined,
        classSubjects: updateDto.classSubjects?.length ? 
          updateDto.classSubjects.map(id => new Types.ObjectId(id)) : 
          undefined
      };
      // Remove undefined or empty string fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });
  
      await repository.findByIdAndUpdate(id, updateData);
      
      const updatedClass = await repository.findWithOptions(
        { _id: new Types.ObjectId(id) },
        {
          populate: {
            path: 'classTeacher classTempTeacher classSubjects',
            select: 'name subject'
          }
        }
      );
      return ClassListResponseDto.fromEntity(updatedClass[0]);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Class with this name and section already exists');
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid ID format provided');
      }
      throw error;
    }
  }

  async assignTeacher(
    connection: Connection,
    classId: string,
    teacherId: string
  ): Promise<ClassListResponseDto> {
    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    await this.checkTeacherAssignment(repository, teacherId, classId);
    
    await repository.findByIdAndUpdate(classId, {
      classTeacher: new Types.ObjectId(teacherId)
    });

    const updatedClass = await repository.findWithOptions(
      { _id: new Types.ObjectId(classId) },
      {
        populate: {
          path: 'classTeacher classTempTeacher classSubjects',
          select: 'name subject'
        }
      }
    );

    return ClassListResponseDto.fromEntity(updatedClass[0]);
  }

  async addSubjects(
    connection: Connection,
    classId: string,
    subjectIds: string[]
  ): Promise<ClassListResponseDto> {
    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    const classDoc = await this.findById(connection, classId);

    const currentSubjects = classDoc.classSubjects || [];
    const newSubjectIds = subjectIds.map(id => new Types.ObjectId(id));
    
    // Add only unique subjects
    const uniqueSubjects = [...new Set([
      ...currentSubjects.map(id => id.toString()),
      ...newSubjectIds.map(id => id.toString())
    ])].map(id => new Types.ObjectId(id));

    await repository.findByIdAndUpdate(classId, {
      classSubjects: uniqueSubjects
    });

    const updatedClass = await repository.findWithOptions(
      { _id: new Types.ObjectId(classId) },
      {
        populate: {
          path: 'classTeacher classTempTeacher classSubjects',
          select: 'name subject'
        }
      }
    );

    return ClassListResponseDto.fromEntity(updatedClass[0]);
  }

  async removeSubjects(
    connection: Connection,
    classId: string,
    subjectIds: string[]
  ): Promise<ClassListResponseDto> {
    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    const classDoc = await this.findById(connection, classId);

    const subjectIdsToRemove = new Set(subjectIds);
    const remainingSubjects = (classDoc.classSubjects || [])
      .filter(subjectId => !subjectIdsToRemove.has(subjectId.toString()));

    await repository.findByIdAndUpdate(classId, {
      classSubjects: remainingSubjects
    });

    const updatedClass = await repository.findWithOptions(
      { _id: new Types.ObjectId(classId) },
      {
        populate: {
          path: 'classTeacher classTempTeacher classSubjects',
          select: 'name subject'
        }
      }
    );

    return ClassListResponseDto.fromEntity(updatedClass[0]);
  }

  async getClassesByGradeLevel(
    connection: Connection,
    gradeLevel: string,
    sectionId?: string
  ): Promise<ClassListResponseDto[]> {
    const query: Record<string, any> = { classGradeLevel: gradeLevel };

    if (sectionId) {
      query.classSection = sectionId;
    }

    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    
    const classes = await repository.findWithOptions(query, {
      populate: {
        path: 'classTeacher classTempTeacher classSubjects',
        select: 'name subject'
      },
      sort: { className: 1 }
    });

    return classes.map(classData => ClassListResponseDto.fromEntity(classData));
  }

  async deleteClass(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    await this.makeConnection(connection);
    const repository = this.getRepository(connection);
    return repository.delete(id);
  }
}

