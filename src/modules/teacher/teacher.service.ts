import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Connection } from 'mongoose';
import { Teacher, TeacherSchema } from './schemas/teacher.schema';
import { BaseService } from '../../common/services/base.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import {
  DocumentDto,
  EducationHistoryDto,
  ExperienceDto,
} from '../../common/dto/index';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherListResponseDto } from './dto/teacher-list-response.dto';
import { SearchTeacherDto } from './dto/search-student.dto';
import { QueryBuilderService } from '../../common/services/query-builder.service';
import { MongoDbUtils } from '../../common/utils/mongodb.utils';

@Injectable()
export class TeacherService extends BaseService<Teacher> {
  constructor(private readonly queryBuilderService: QueryBuilderService) {
    super('Teacher', TeacherSchema);
  }

  async createTeacher(
    connection: Connection,
    createDto: CreateTeacherDto,
  ): Promise<TeacherListResponseDto> {
    const repository = this.getRepository(connection);

    const teacherData = {
      ...createDto,
      ...(createDto.classTeacherOf && {
        classTeacherOf: MongoDbUtils.toObjectIdOrNull(
          createDto.classTeacherOf.toString(),
        ),
      }),
    };

    const newTeacher = await repository.create(teacherData);
    const populatedTeacher = await repository.findWithOptions(
      { _id: newTeacher._id },
      {
        populate: {
          path: 'classTeacherOf',
          select: 'className',
        },
      },
    );

    return TeacherListResponseDto.fromEntity(populatedTeacher[0]);
  }

  async searchTeachers(connection: Connection, searchDto: SearchTeacherDto) {
    const repository = this.getRepository(connection);

    const fieldMappings = {
      firstName: (value: string) =>
        value ? { firstName: { $regex: value, $options: 'i' } } : null,
      lastName: (value: string) =>
        value ? { lastName: { $regex: value, $options: 'i' } } : null,
      classTeacherOf: (value: string) => {
        const classId = MongoDbUtils.toObjectIdOrNull(value);
        return classId ? { classTeacherOf: classId } : null;
      },
      qualification: (value: string) =>
        value ? { qualifications: { $regex: value, $options: 'i' } } : null,
    };

    const query = this.queryBuilderService.buildSearchQuery(
      searchDto,
      fieldMappings,
    );

    const teachers = await repository.findWithOptions(query, {
      populate: {
        path: 'classTeacherOf',
        select: 'className',
      },
      sort: { firstName: 1, lastName: 1 },
    });

    return teachers.map((teacher) =>
      TeacherListResponseDto.fromEntity(teacher),
    );
  }

  async findById(connection: Connection, id: string): Promise<Teacher> {
    const objectId = MongoDbUtils.validateId(id, 'teacher');
    const repository = this.getRepository(connection);

    const teacher = await repository.findWithOptions(
      { _id: objectId },
      {
        populate: {
          path: 'classTeacherOf userId',
          select: 'className email',
        },
      },
    );

    if (!teacher || !teacher.length) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher[0];
  }

  async updateTeacherById(
    connection: Connection,
    id: string,
    updateDto: UpdateTeacherDto,
  ): Promise<TeacherListResponseDto> {
    const objectId = MongoDbUtils.validateId(id, 'teacher');
    const repository = this.getRepository(connection);
    const updateData = {
      ...updateDto,
      ...(updateDto.classTeacherOf && {
        classTeacherOf: MongoDbUtils.toObjectIdOrNull(
          updateDto.classTeacherOf.toString(),
        ),
      }),
    };

    await repository.findByIdAndUpdate(id, updateData);

    const updatedTeacher = await repository.findWithOptions(
      { _id: objectId },
      {
        populate: {
          path: 'classTeacherOf',
          select: 'className',
        },
      },
    );

    if (!updatedTeacher || !updatedTeacher.length) {
      throw new NotFoundException('Teacher not found');
    }

    return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
  }

  async assignTeacherToClass(
    connection: Connection,
    teacherId: string,
    classId: string,
  ): Promise<TeacherListResponseDto> {
    const teacherObjectId = MongoDbUtils.validateId(teacherId, 'teacher');
    const classObjectId = MongoDbUtils.validateId(classId, 'class');

    const repository = this.getRepository(connection);

    const existingClassTeacher = await repository.findOne({
      classTeacherOf: classObjectId,
    });

    if (existingClassTeacher) {
      throw new ConflictException('This class already has a teacher assigned');
    }

    await repository.findByIdAndUpdate(teacherId, {
      classTeacherOf: classObjectId,
    });

    const updatedTeacher = await repository.findWithOptions(
      { _id: teacherObjectId },
      {
        populate: {
          path: 'classTeacherOf',
          select: 'className',
        },
      },
    );

    return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
  }

  async addEducationHistory(
    connection: Connection,
    teacherId: string,
    education: EducationHistoryDto,
  ): Promise<TeacherListResponseDto> {
    const objectId = MongoDbUtils.validateId(teacherId, 'teacher');
    const repository = this.getRepository(connection);

    const teacher = await repository.findById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const educationHistory = teacher.educationHistory || [];
    educationHistory.push(education);

    await repository.findByIdAndUpdate(teacherId, { educationHistory });

    const updatedTeacher = await repository.findWithOptions(
      { _id: objectId },
      {
        populate: {
          path: 'classTeacherOf',
          select: 'className',
        },
      },
    );

    return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
  }

  async addExperience(
    connection: Connection,
    teacherId: string,
    experience: ExperienceDto,
  ): Promise<TeacherListResponseDto> {
    const objectId = MongoDbUtils.validateId(teacherId, 'teacher');
    const repository = this.getRepository(connection);

    const teacher = await repository.findById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const experienceList = teacher.experience || [];
    experienceList.push(experience);

    await repository.findByIdAndUpdate(teacherId, {
      experience: experienceList,
    });

    const updatedTeacher = await repository.findWithOptions(
      { _id: objectId },
      {
        populate: {
          path: 'classTeacherOf',
          select: 'className',
        },
      },
    );

    return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
  }

  async addDocument(
    connection: Connection,
    teacherId: string,
    document: DocumentDto,
  ): Promise<TeacherListResponseDto> {
    const objectId = MongoDbUtils.validateId(teacherId, 'teacher');
    const repository = this.getRepository(connection);

    const teacher = await repository.findById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const documents = teacher.documents || [];
    documents.push({ ...document, uploadDate: new Date() });

    await repository.findByIdAndUpdate(teacherId, { documents });

    const updatedTeacher = await repository.findWithOptions(
      { _id: objectId },
      {
        populate: {
          path: 'classTeacherOf',
          select: 'className',
        },
      },
    );

    return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
  }

  async updateTeacherStatus(
    connection: Connection,
    teacherId: string,
    employmentStatus: string,
  ): Promise<TeacherListResponseDto> {
    const objectId = MongoDbUtils.validateId(teacherId, 'teacher');
    const repository = this.getRepository(connection);

    await repository.findByIdAndUpdate(teacherId, { employmentStatus });

    const updatedTeacher = await repository.findWithOptions(
      { _id: objectId },
      {
        populate: {
          path: 'classTeacherOf',
          select: 'className',
        },
      },
    );

    if (!updatedTeacher || !updatedTeacher.length) {
      throw new NotFoundException('Teacher not found');
    }

    return TeacherListResponseDto.fromEntity(updatedTeacher[0]);
  }

  async deleteTeacher(
    connection: Connection,
    teacherId: string,
  ): Promise<boolean> {
    MongoDbUtils.validateId(teacherId, 'teacher');
    const repository = this.getRepository(connection);

    const result = await repository.delete(teacherId);
    if (!result) {
      throw new NotFoundException('Teacher not found');
    }

    return true;
  }
}
