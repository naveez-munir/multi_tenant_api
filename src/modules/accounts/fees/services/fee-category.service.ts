import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { FeeCategory, FeeCategorySchema } from '../../schemas/fee-category.schema';
import { BaseService } from 'src/common/services/base.service';
import { CreateFeeCategoryDto, ListFeeCategoryDto, UpdateFeeCategoryDto } from '../dto/create-fee-category.dto';
import { studentFeeSchema } from '../../schemas/student-fee.schema';

@Injectable()
export class FeeCategoryService extends BaseService<FeeCategory> {
  constructor() {
    super('FeeCategory', FeeCategorySchema);
  }

  async createFeeCategory(
    connection: Connection,
    createDto: CreateFeeCategoryDto
  ): Promise<FeeCategory> {
    const repository = this.getRepository(connection);
    
    const existing = await repository.findOne({ name: createDto.name });
    if (existing) {
      throw new ConflictException('Fee category with this name already exists');
    }

    return repository.create(createDto as unknown as Partial<FeeCategory>);
  }

  async getFeeCategories(
    connection: Connection,
    query: ListFeeCategoryDto
  ): Promise<FeeCategory[]> {
    const repository = this.getRepository(connection);
    const filter: Record<string, any> = {};
    
    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }
    
    if (query.frequency) {
      filter.frequency = query.frequency;
    }
    
    return repository.findWithOptions(filter, {
      sort: { name: 1 }
    });
  }

  async getFeeCategoryById(
    connection: Connection,
    id: string
  ): Promise<FeeCategory> {
    const repository = this.getRepository(connection);
    const category = await repository.findById(id);
    
    if (!category) {
      throw new NotFoundException('Fee category not found');
    }
    
    return category;
  }

  async updateFeeCategory(
    connection: Connection,
    id: string,
    updateDto: UpdateFeeCategoryDto
  ): Promise<FeeCategory> {
    const repository = this.getRepository(connection);
    
    if (updateDto.name) {
      const existing = await repository.findOne({ 
        name: updateDto.name,
        _id: { $ne: id }
      });
      if (existing) {
        throw new ConflictException('Fee category with this name already exists');
      }
    }

    const updated = await repository.findByIdAndUpdate(id, updateDto as unknown as Partial<FeeCategory>);
    if (!updated) {
      throw new NotFoundException('Fee category not found');
    }
    
    return updated;
  }

  async deleteFeeCategory(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    const isUsed = await this.checkCategoryUsage(connection, id);
    
    if (isUsed) {
      throw new ConflictException('Cannot delete fee category as it is being used');
    }
    
    return repository.delete(id);
  }

  async toggleFeeCategoryStatus(
    connection: Connection,
    id: string
  ): Promise<FeeCategory> {
    const repository = this.getRepository(connection);
    const category = await repository.toggleField(id, 'isActive');
    
    if (!category) {
      throw new NotFoundException('Fee category not found');
    }
    
    return category;
  }
  async getCategoryUsageStats(
    connection: Connection,
    categoryId: string,
    academicYear?: string
  ) {
    const feeStructureRepo = connection.model('FeeStructure',FeeCategorySchema);
    const studentFeeRepo = connection.model('StudentFee', studentFeeSchema);

    const structureFilter: any = {
      'feeComponents.feeCategory': Types.ObjectId.createFromHexString(categoryId)
    };
    
    if (academicYear) {
      structureFilter.academicYear = academicYear;
    }

    const structureCount = await feeStructureRepo.countDocuments(structureFilter);

    const totalBilled = await studentFeeRepo.aggregate([
      {
        $match: {
          'feeDetails.feeCategory': Types.ObjectId.createFromHexString(categoryId),
          ...(academicYear ? { academicYear } : {})
        }
      },
      {
        $unwind: '$feeDetails'
      },
      {
        $match: {
          'feeDetails.feeCategory': Types.ObjectId.createFromHexString(categoryId)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$feeDetails.originalAmount' },
          collected: { $sum: '$feeDetails.paidAmount' },
          outstanding: { $sum: '$feeDetails.dueAmount' }
        }
      }
    ]).then(results => results[0] || { total: 0, collected: 0, outstanding: 0 });
    
    return {
      categoryId,
      usedInStructures: structureCount,
      financials: totalBilled,
      academicYear: academicYear || 'all'
    };
  }
  
  async validateCategories(
    connection: Connection,
    categoryIds: string[]
  ): Promise<{valid: string[], invalid: string[]}> {
    const repository = this.getRepository(connection);
    const valid: string[] = [];
    const invalid: string[] = [];
    
    for (const id of categoryIds) {
      try {
        const category = await repository.findById(id);
        if (category) {
          valid.push(id);
        } else {
          invalid.push(id);
        }
      } catch (error) {
        invalid.push(id);
      }
    }
    
    return { valid, invalid };
  }

  private async checkCategoryUsage(connection: Connection, categoryId: string): Promise<boolean> {
    const feeStructureRepo = connection.model('FeeStructure');
    const count = await feeStructureRepo.countDocuments({
      'feeComponents.feeCategory': Types.ObjectId.createFromHexString(categoryId)
    });
    return count > 0;
  }
}
