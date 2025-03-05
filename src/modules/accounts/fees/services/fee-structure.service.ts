import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { BaseService } from '../../../../common/services/base.service';
import { BulkGenerateFeeStructureDto, CloneFeeStructureDto, CreateFeeStructureDto, FeeComponentDto, ListFeeStructureDto, UpdateFeeStructureDto } from '../dto/create-fee-structure.dto';
import { FeeStructure, feeStructureSchema } from '../../schemas/fee-structure.schema';
import { FeeCategoryService } from './fee-category.service';
import { ValidateFeeStructureInput } from '../../interfaces/fee-structure.interface';

@Injectable()
export class FeeStructureService extends BaseService<FeeStructure> {
  constructor(
    private readonly feeCategoryService: FeeCategoryService
  ) {
    super('FeeStructure', feeStructureSchema);
  }

  async createFeeStructure(
    connection: Connection,
    createDto: CreateFeeStructureDto
  ): Promise<FeeStructure> {
    const repository = this.getRepository(connection);

    if (!this.isValidObjectId(createDto.classId)) {
      throw new BadRequestException(`Invalid classId format: ${createDto.classId}`);
    }

    for (const component of createDto.feeComponents) {
      if (!this.isValidObjectId(component.feeCategory)) {
        throw new BadRequestException(`Invalid feeCategory format: ${component.feeCategory}`);
      }
    }

    const validationData: ValidateFeeStructureInput = {
      academicYear: createDto.academicYear,
      classId: createDto.classId,
      feeComponents: createDto.feeComponents.map(component => ({
        ...component,
        feeCategory: Types.ObjectId.createFromHexString(component.feeCategory)
      }))
    };
    
    await this.validateNewFeeStructure(connection, validationData);
    await this.validateFeeCategories(connection, createDto.feeComponents);
  
    const feeStructure = await repository.create({
      ...createDto,
      classId: Types.ObjectId.createFromHexString(createDto.classId),
      feeComponents: createDto.feeComponents.map(component => ({
        ...component,
        feeCategory: Types.ObjectId.createFromHexString(component.feeCategory)
      }))
    });

    return feeStructure
  }

  async getFeeStructures(
    connection: Connection,
    query: ListFeeStructureDto
  ): Promise<FeeStructure[]> {
    const repository = this.getRepository(connection);
    const filter: Record<string, any> = {};

    if (query.academicYear) {
      filter.academicYear = query.academicYear;
    }

    if (query.classId) {
      filter.classId = Types.ObjectId.createFromHexString(query.classId);
    }

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    const structures = await repository.findWithOptions(filter, {
      sort: query.sortByDueDate ? 
        { 'feeComponents.dueDay': query.sortByDueDate === 'asc' ? 1 : -1 } : 
        { academicYear: -1 },
      pagination: {
        page: query.skip ? Math.floor(query.skip / (query.limit || 10)) + 1 : 1,
        limit: query.limit || 10
      }
    });

    return structures
  }

  async getFeeStructureById(
    connection: Connection,
    id: string
  ): Promise<FeeStructure> {
    const repository = this.getRepository(connection);
    const feeStructure = await repository.findById(id);

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure
  }

  async getFeeStructureByClassAndYear(
    connection: Connection,
    classId: string,
    academicYear: string
  ): Promise<FeeStructure> {
    const repository = this.getRepository(connection);
    const feeStructure = await repository.findOne({
      classId: Types.ObjectId.createFromHexString(classId),
      academicYear,
      isActive: true
    });

    if (!feeStructure) {
      throw new NotFoundException(
        'No active fee structure found for this class and academic year'
      );
    }

    return feeStructure
  }

  async updateFeeStructure(
    connection: Connection,
    id: string,
    updateDto: UpdateFeeStructureDto
  ): Promise<FeeStructure> {
    const repository = this.getRepository(connection);
    const existing = await this.getFeeStructureById(connection, id);

    if (updateDto.feeComponents) {
      await this.validateFeeCategories(connection, updateDto.feeComponents);
    }

    const updatedStructure = await repository.findByIdAndUpdate(id, {
      ...updateDto,
      classId: updateDto.classId ? 
        Types.ObjectId.createFromHexString(updateDto.classId) : 
        existing.classId,
      feeComponents: updateDto.feeComponents?.map(component => ({
        ...component,
        feeCategory: Types.ObjectId.createFromHexString(component.feeCategory)
      })) || existing.feeComponents
    });

    return updatedStructure
  }

  async deleteFeeStructure(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    const isUsed = await this.checkStructureUsage(connection, id);

    if (isUsed) {
      throw new ConflictException(
        'Cannot delete fee structure as it is being used by student fees'
      );
    }

    return repository.delete(id);
  }

  async bulkGenerateFeeStructures(
    connection: Connection,
    bulkGenerateDto: BulkGenerateFeeStructureDto
  ): Promise<FeeStructure[]> {
    const repository = this.getRepository(connection);

    await Promise.all([
      this.validateClassIds(connection, bulkGenerateDto.classIds),
      this.validateFeeCategories(connection, bulkGenerateDto.feeComponents)
    ]);

    const structures = await Promise.all(
      bulkGenerateDto.classIds.map(classId =>
        repository.create({
          academicYear: bulkGenerateDto.academicYear,
          classId: Types.ObjectId.createFromHexString(classId),
          feeComponents: bulkGenerateDto.feeComponents.map(component => ({
            ...component,
            feeCategory: Types.ObjectId.createFromHexString(component.feeCategory)
          }))
        })
      )
    );

    return structures;
  }

  async cloneFeeStructure(
    connection: Connection,
    id: string,
    cloneDto: CloneFeeStructureDto
  ): Promise<FeeStructure> {
    const repository = this.getRepository(connection);
    const sourceStructure = await this.getFeeStructureById(connection, id);

    await this.validateNewFeeStructure(connection, {
      academicYear: cloneDto.newAcademicYear,
      classId: cloneDto.newClassId || sourceStructure.classId.toString(),
      feeComponents: []
    });

    const newComponents = sourceStructure.feeComponents.map(component => {
      const override = cloneDto.componentOverrides?.find(
        o => o.feeCategoryId === component.feeCategory.toString()
      );

      if (override) {
        return {
          ...component,
          amount: override.newAmount,
          dueDay: override.newDueDay || component.dueDay,
          lateChargeType: override.newLateChargeType || component.lateChargeType,
          lateChargeValue: override.newLateChargeValue || component.lateChargeValue
        };
      }

      if (cloneDto.incrementPercentage) {
        return {
          ...component,
          amount: component.amount * (1 + cloneDto.incrementPercentage / 100)
        };
      }

      return component;
    });

    const newStructure = await repository.create({
      academicYear: cloneDto.newAcademicYear,
      classId: cloneDto.newClassId ? 
        Types.ObjectId.createFromHexString(cloneDto.newClassId) : 
        sourceStructure.classId,
      feeComponents: newComponents
    });

    return newStructure;
  }

  async toggleFeeStructureStatus(
    connection: Connection,
    id: string
  ): Promise<FeeStructure> {
    const repository = this.getRepository(connection);
    const structure = await repository.toggleField(id, 'isActive');

    if (!structure) {
      throw new NotFoundException('Fee structure not found');
    }

    return structure;
  }

  private async validateNewFeeStructure(
    connection: Connection,
    data: ValidateFeeStructureInput
  ): Promise<void> {
    const repository = this.getRepository(connection);
    const existing = await repository.findOne({
      classId: Types.ObjectId.createFromHexString(data.classId),
      academicYear: data.academicYear,
      isActive: true
    });

    if (existing) {
      throw new ConflictException(
        'Active fee structure already exists for this class and academic year'
      );
    }
  }

  private async validateClassIds(
    connection: Connection,
    classIds: string[]
  ): Promise<void> {
    const classRepo = connection.model('Class');
    const classes = await classRepo.find({
      _id: { $in: classIds.map(id => Types.ObjectId.createFromHexString(id)) },
      isActive: true
    });

    if (classes.length !== classIds.length) {
      throw new BadRequestException('One or more class IDs are invalid or inactive');
    }
  }

  private async validateFeeCategories(
    connection: Connection,
    components: FeeComponentDto[]
  ): Promise<void> {
    const categoryIds = components.map(c => c.feeCategory);
    const categories = await Promise.all(
      categoryIds.map(id => 
        this.feeCategoryService.getFeeCategoryById(connection, id)
          .catch(() => null)
      )
    );

    const invalidCategories = categories.filter(c => !c || !c.isActive);
    if (invalidCategories.length > 0) {
      throw new BadRequestException('One or more fee categories are invalid or inactive');
    }
  }

  private async checkStructureUsage(
    connection: Connection,
    structureId: string
  ): Promise<boolean> {
    const studentFeeRepo = connection.model('StudentFee');
    const count = await studentFeeRepo.countDocuments({
      feeStructureId: Types.ObjectId.createFromHexString(structureId)
    });
    return count > 0;
  }

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
}
