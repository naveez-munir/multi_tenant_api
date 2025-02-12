import { Injectable, ConflictException } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import { BaseService } from 'src/common/services/base.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService extends BaseService<Subject> {
  constructor() {
    super('Subject', SubjectSchema);
  }

  async createSubject(
    connection: Connection,
    createDto: CreateSubjectDto
  ) {
    try {
      const repository = this.getRepository(connection);
      return await repository.create(createDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Subject with this code already exists');
      }
      throw error;
    }
  }

  async findSubjects(
    connection: Connection,
    filter: { name?: string; subjectCode?: string } = {}
  ) {
    const repository = this.getRepository(connection);
    return repository.find(filter);
  }

  async findById(
    connection: Connection,
    id: string
  ) {
    const repository = this.getRepository(connection);
    return repository.findById(id);
  }

  async updateSubject(
    connection: Connection,
    id: string,
    updateDto: UpdateSubjectDto
  ) {
    try {
      const repository = this.getRepository(connection);
      return await repository.findByIdAndUpdate(id, updateDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Subject with this name or code already exists');
      }
      throw error;
    }
  }

  async deleteSubject(
    connection: Connection,
    id: string
  ) {
    const repository = this.getRepository(connection);
    return repository.delete(id);
  }
}
