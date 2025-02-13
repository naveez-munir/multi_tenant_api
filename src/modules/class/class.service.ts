import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Class, ClassSchema } from './schemas/class.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { TenantAwareRepository } from 'src/common/repositories/tenant-aware.repository';
import { SubjectSchema } from '../subject/schemas/subject.schema';
import { TeacherSchema } from '../teacher/schemas/teacher.schema';

@Injectable()
export class ClassService extends BaseService<Class> {
  constructor() {
    super('Class', ClassSchema);
  }

  private async checkTeacherAssignment(
    repository: TenantAwareRepository<Class>,
    teacherId: string,
    excludeClassId?: string
  ): Promise<void> {
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
  }

  //Added this function to handle modal initialize issue 
  private async makeConnection(connection: Connection):Promise<void> {
    try {
      connection.model('Subject', SubjectSchema);
      connection.model('Teacher', TeacherSchema);
    } catch (error) {
      console.log(error)
    }
  }

  async createClass(
    connection: Connection,
    createDto: CreateClassDto
  ): Promise<Class> {
    try {
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
      return this.findById(connection, newClass._id.toString());
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
  ): Promise<Class[]> {
    this.makeConnection(connection);
    const repository = this.getRepository(connection);
    return repository.findWithOptions(filter, {
      populate: {
        path: 'classTeacher classTempTeacher classSubjects'
      }
    });
  }

  async findById(
    connection: Connection,
    id: string
  ): Promise<Class> {
    this.makeConnection(connection);
    const repository = this.getRepository(connection);
    const classDoc = await repository.findWithOptions(
      { _id: new Types.ObjectId(id) },
      {
        populate: {
          path: 'classTeacher classTempTeacher classSubjects'
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
  ): Promise<Class> {
    try {
      const repository = this.getRepository(connection);

      if (updateDto.classTeacher) {
        await this.checkTeacherAssignment(repository, updateDto.classTeacher.toString(), id);
      }

      const updateData: Partial<Class> = {
        ...updateDto,
        ...(updateDto.classTeacher && {
          classTeacher: new Types.ObjectId(updateDto.classTeacher)
        }),
        ...(updateDto.classTempTeacher && {
          classTempTeacher: new Types.ObjectId(updateDto.classTempTeacher)
        }),
        ...(updateDto.classSubjects && {
          classSubjects: updateDto.classSubjects.map(id => new Types.ObjectId(id))
        })
      };

      await repository.findByIdAndUpdate(id, updateData);
      return this.findById(connection, id);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Class with this name and section already exists');
      }
      throw error;
    }
  }

  async assignTeacher(
    connection: Connection,
    classId: string,
    teacherId: string
  ): Promise<Class> {
    const repository = this.getRepository(connection);
    await this.checkTeacherAssignment(repository, teacherId, classId);
    
    await repository.findByIdAndUpdate(classId, {
      classTeacher: new Types.ObjectId(teacherId)
    });

    return this.findById(connection, classId);
  }

  async addSubjects(
    connection: Connection,
    classId: string,
    subjectIds: string[]
  ): Promise<Class> {
    const repository = this.getRepository(connection);
    const classDoc = await this.findById(connection, classId);

    const currentSubjects = classDoc.classSubjects || [];
    const newSubjectIds = subjectIds.map(id => new Types.ObjectId(id));
    
    // Add only unique subjects that don't already exist
    const uniqueSubjects = [...new Set([
      ...currentSubjects.map(id => id.toString()),
      ...newSubjectIds.map(id => id.toString())
    ])].map(id => new Types.ObjectId(id));

    await repository.findByIdAndUpdate(classId, {
      classSubjects: uniqueSubjects
    });

    return this.findById(connection, classId);
  }

  async removeSubjects(
    connection: Connection,
    classId: string,
    subjectIds: string[]
  ): Promise<Class> {
    const repository = this.getRepository(connection);
    const classDoc = await this.findById(connection, classId);

    const subjectIdsToRemove = new Set(subjectIds);
    const remainingSubjects = (classDoc.classSubjects || [])
      .filter(subjectId => !subjectIdsToRemove.has(subjectId.toString()));

    await repository.findByIdAndUpdate(classId, {
      classSubjects: remainingSubjects
    });

    return this.findById(connection, classId);
  }

  async getClassesByGradeLevel(
    connection: Connection,
    gradeLevel: string,
    sectionId?: string
  ): Promise<Class[]> {
    const query: Record<string, any> = { classGradeLevel: gradeLevel };

    if (sectionId) {
      query.classSection = sectionId;
    }

    return this.findClasses(connection, query);
  }

  async deleteClass(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    return repository.delete(id);
  }
}

