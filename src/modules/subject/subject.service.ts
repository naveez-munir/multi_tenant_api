import { Injectable } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import { BaseService } from 'src/common/services/base.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class SubjectService extends BaseService<Subject> {
  constructor() {
    super('Subject', SubjectSchema);
  }

  async createSubject(
    connection: Connection,
    createDto: CreateSubjectDto
  ) {
    const repository = this.getRepository(connection);
    return await repository.create(createDto);
  }

  async findSubjects(
    connection: Connection,
    filter: { name?: string; subjectCode?: string } = {},
    paginationQuery?: PaginationQueryDto
  ){
    const repository = this.getRepository(connection);

    const searchQuery: Record<string, any> = {};
    if (filter.name) {
      searchQuery.name = { $regex: new RegExp(filter.name, 'i') };
    }
    if (filter.subjectCode) {
      searchQuery.subjectCode = { $regex: new RegExp(filter.subjectCode, 'i') };
    }
    return repository.findWithOptions(searchQuery, {
      sort: { createdAt: -1 },
      // pagination: {
      //   page: paginationQuery?.page || 1,
      //   limit: paginationQuery?.limit || 10
      // }
      //No need for pagination as of now
    });
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
    const repository = this.getRepository(connection);
    return await repository.findByIdAndUpdate(id, updateDto);
  }

  async deleteSubject(
    connection: Connection,
    id: string
  ) {
    const repository = this.getRepository(connection);
    return repository.delete(id);
  }
}
