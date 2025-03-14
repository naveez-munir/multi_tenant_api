import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection } from 'mongoose';
import { ExamType, examTypeSchema } from '../schemas/exam-type.schema';
import { BaseService } from 'src/common/services/base.service';
import { CreateExamTypeDto } from '../dto/create-exam-type.dto';
import { UpdateExamTypeDto } from '../dto/update-exam-type.dto';

@Injectable()
export class ExamTypeService extends BaseService<ExamType> {
  constructor() {
    super('ExamType', examTypeSchema);
  }

  async createExamType(
    connection: Connection,
    createDto: CreateExamTypeDto
  ): Promise<ExamType> {
    try {
      const repository = this.getRepository(connection);
      return await repository.create(createDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Exam type with this name already exists');
      }
      throw error;
    }
  }

  async getAllExamTypes(
    connection: Connection,
    activeOnly: boolean = false
  ): Promise<ExamType[]> {
    const repository = this.getRepository(connection);
    const query = activeOnly ? { isActive: true } : {};
    return repository.find(query);
  }

  async getExamTypeById(
    connection: Connection,
    id: string
  ): Promise<ExamType> {
    const repository = this.getRepository(connection);
    const examType = await repository.findById(id);
    
    if (!examType) {
      throw new NotFoundException('Exam type not found');
    }
    
    return examType;
  }

  async updateExamType(
    connection: Connection,
    id: string,
    updateDto: UpdateExamTypeDto
  ): Promise<ExamType> {
    try {
      const repository = this.getRepository(connection);
      const updated = await repository.findByIdAndUpdate(id, updateDto);
      
      if (!updated) {
        throw new NotFoundException('Exam type not found');
      }
      
      return updated;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Exam type with this name already exists');
      }
      throw error;
    }
  }

  async deleteExamType(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    const deleted = await repository.delete(id);
    
    if (!deleted) {
      throw new NotFoundException('Exam type not found');
    }
    
    return true;
  }

  async toggleExamTypeStatus(
    connection: Connection,
    id: string
  ): Promise<ExamType> {
    const repository = this.getRepository(connection);
    const examType = await repository.findById(id);
    
    if (!examType) {
      throw new NotFoundException('Exam type not found');
    }
    
    return repository.findByIdAndUpdate(id, { 
      isActive: !examType.isActive 
    });
  }
}
