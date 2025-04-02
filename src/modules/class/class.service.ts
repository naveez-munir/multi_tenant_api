import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { Class, ClassSchema } from './schemas/class.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateClassDto, TeacherType } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassListResponseDto } from './dto/class-list-response.dto';
import { TenantAwareRepository } from 'src/common/repositories/tenant-aware.repository';
import { MongoDbUtils } from 'src/common/utils/mongodb.utils';

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
      $or: [
        { classTeacher: new Types.ObjectId(teacherId) },
        { classTempTeacher: new Types.ObjectId(teacherId) }
      ]
    };

    if (excludeClassId) {
      query._id = { $ne: new Types.ObjectId(excludeClassId) };
    }

    const existingClass = await repository.findOne(query);
    if (existingClass) {
      throw new BadRequestException('Teacher is already assigned to another class');
    }
  }

  private cleanClassData(data: CreateClassDto | UpdateClassDto) {
    const cleanedData = { ...data };
    if (data.classSection?.trim() === '') {
      delete cleanedData.classSection;
    }
    if (!data.classTeacher || data.classTeacher.toString() === '') {
      delete cleanedData.classTeacher;
    }
    if (!data.classTempTeacher || data.classTempTeacher.toString() === '') {
      delete cleanedData.classTempTeacher;
    }
    return cleanedData;
  }

  async createClass(
    connection: Connection,
    createDto: CreateClassDto
  ): Promise<ClassListResponseDto> {
    const repository = this.getRepository(connection);
    const cleanedData = this.cleanClassData(createDto);

    if (cleanedData.classTeacher) {
      await this.checkTeacherAssignment(repository, cleanedData.classTeacher.toString());
    }

    const newClass = await repository.create(cleanedData);
    const populatedClass = await this.getPopulatedClass(repository, newClass._id);

    return ClassListResponseDto.fromEntity(populatedClass[0]);
  }

  async findClasses(
    connection: Connection,
    filter: Record<string, any> = {}
  ): Promise<ClassListResponseDto[]> {
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
    const repository = this.getRepository(connection);

    MongoDbUtils.validateId(id)
    const classDoc = await repository.findWithOptions({
      _id: new Types.ObjectId(id)
    },
    {
      populate: {
        path: 'classTeacher classTempTeacher classSubjects',
      }
    }
  )

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
    const repository = this.getRepository(connection);
    const cleanedData = this.cleanClassData(updateDto);

    if (cleanedData.classTeacher) {
      await this.checkTeacherAssignment(repository, cleanedData.classTeacher.toString(), id);
    }

    await repository.findByIdAndUpdate(id, cleanedData);
    const updatedClass = await this.getPopulatedClass(repository, id);
    
    return ClassListResponseDto.fromEntity(updatedClass[0]);
  }

  async assignTeacher(
    connection: Connection,
    classId: string,
    teacherId: string
  ): Promise<ClassListResponseDto> {
    const repository = this.getRepository(connection);
    await this.checkTeacherAssignment(repository, teacherId, classId);
    
    await repository.findByIdAndUpdate(classId, {
      classTeacher: new Types.ObjectId(teacherId)
    });

    const updatedClass = await this.getPopulatedClass(repository, classId);
    return ClassListResponseDto.fromEntity(updatedClass[0]);
  }

  async handleTeacherAssignment(
    connection: Connection,
    classId: string,
    teacherType: TeacherType,
    teacherId?: string,
  ): Promise<ClassListResponseDto> {

    MongoDbUtils.validateId(classId)

    const repository = this.getRepository(connection);
    const TeacherModel = connection.model('Teacher');

    const classDoc = await repository.findById(classId);
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    if (teacherId) {
      await repository.findByIdAndUpdate(classId, {
        [teacherType === TeacherType.MAIN ? 'classTeacher' : 'classTempTeacher']: new Types.ObjectId(teacherId)
      });
      await TeacherModel.findByIdAndUpdate(teacherId, {
        classTeacherOf: new Types.ObjectId(classId)
      });
    } else {
      const currentTeacherId = teacherType === TeacherType.MAIN 
        ? classDoc.classTeacher 
        : classDoc.classTempTeacher;
        
      await repository.findByIdAndUpdate(classId, {
        [teacherType === TeacherType.MAIN ? 'classTeacher' : 'classTempTeacher']: null
      });
      
      if (currentTeacherId) {
        await TeacherModel.findByIdAndUpdate(currentTeacherId, {
          classTeacherOf: null
        });
      }
    }

    const updatedClass = await this.getPopulatedClass(repository, classId);
    return ClassListResponseDto.fromEntity(updatedClass[0]);
  }

  async addSubjects(
    connection: Connection,
    classId: string,
    subjectIds: string[]
  ): Promise<ClassListResponseDto> {
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

    const updatedClass = await this.getPopulatedClass(repository, classId);
    return ClassListResponseDto.fromEntity(updatedClass[0]);
  }

  async removeSubjects(
    connection: Connection,
    classId: string,
    subjectIds: string[]
  ): Promise<ClassListResponseDto> {
    const repository = this.getRepository(connection);
    const classDoc = await this.findById(connection, classId);

    const subjectIdsToRemove = new Set(subjectIds);
    const remainingSubjects = (classDoc.classSubjects || [])
      .filter(subjectId => !subjectIdsToRemove.has(subjectId.toString()));

    await repository.findByIdAndUpdate(classId, {
      classSubjects: remainingSubjects
    });

    const updatedClass = await this.getPopulatedClass(repository, classId);
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
    const repository = this.getRepository(connection);
    return repository.delete(id);
  }

  private async getPopulatedClass(repository: TenantAwareRepository<Class>, classId: string | Types.ObjectId) {
    return repository.findWithOptions(
      { _id: typeof classId === 'string' ? new Types.ObjectId(classId) : classId },
      {
        populate: {
          path: 'classTeacher classTempTeacher classSubjects',
          select: 'name subject'
        }
      }
    );
  }
}

