import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { BaseService } from '../../../../common/services/base.service';
import {
  StudentDiscount,
  studentDiscountSchema,
} from '../../schemas/student-discount.schema';
import {
  CreateStudentDiscountDto,
  UpdateStudentDiscountDto,
} from '../dto/student-discount.dto';
import { FeeCategoryService } from './fee-category.service';
import { studentFeeSchema } from '../../schemas/student-fee.schema';
import { StudentSchema } from 'src/modules/student/schemas/student.schema';
import { StudentFeeService } from './student-fee.service';
import { FeeHelperService } from './fee-helper.service';

@Injectable()
export class StudentDiscountService extends BaseService<StudentDiscount> {
  constructor(
    private readonly feeCategoryService: FeeCategoryService,
    private readonly feeHelperService: FeeHelperService,
    private readonly studentFeeService: StudentFeeService,
  ) {
    super('StudentDiscount', studentDiscountSchema);
  }

  private handleServiceError(error: any, operationName: string): never {
    this.feeHelperService.handleServiceError(error, 'create student discount');
  }

  async createDiscount(
    connection: Connection,
    createDto: CreateStudentDiscountDto,
    syncWithFees: boolean = true,
  ): Promise<StudentDiscount> {
    try {
      const repository = this.getRepository(connection);

      this.feeHelperService.validateObjectId(createDto.studentId, 'student');

      if (
        createDto.discountValueType === 'PERCENTAGE' &&
        createDto.discountValue > 100
      ) {
        throw new BadRequestException(
          'Percentage discount cannot be greater than 100%',
        );
      }

      await this.feeHelperService.validateStudent(
        connection,
        createDto.studentId,
      );

      if (createDto.applicableCategories?.length) {
        for (const categoryId of createDto.applicableCategories) {
          if (!Types.ObjectId.isValid(categoryId)) {
            throw new BadRequestException(
              `Invalid fee category ID: ${categoryId}`,
            );
          }
        }
        await this.validateFeeCategories(
          connection,
          createDto.applicableCategories,
        );
      }

      // Check for overlapping date ranges for the same type of discount
      await this.validateNoOverlappingDiscounts(
        connection,
        createDto.studentId,
        createDto.discountType,
        createDto.startDate,
        createDto.endDate,
      );

      const discount = await repository.create({
        ...createDto,
        studentId: Types.ObjectId.createFromHexString(createDto.studentId),
        applicableCategories: createDto.applicableCategories?.map((id) =>
          Types.ObjectId.createFromHexString(id),
        ),
        isActive: true,
      });

      if (
        syncWithFees &&
        new Date(createDto.startDate.toString()) <= new Date()
      ) {
        await this.studentFeeService.synchronizeDiscountsForStudent(
          connection,
          discount.studentId.toString(),
        );
      }

      return discount;
    } catch (error) {
      this.handleServiceError(error, 'create student discount');
    }
  }

  async findByStudent(
    connection: Connection,
    studentId: string,
  ): Promise<StudentDiscount[]> {
    try {
      if (!Types.ObjectId.isValid(studentId)) {
        throw new BadRequestException(`Invalid studentId: ${studentId}`);
      }

      const repository = this.getRepository(connection);
      return repository.findWithOptions(
        {
          studentId: Types.ObjectId.createFromHexString(studentId),
          isActive: true,
          startDate: { $lte: new Date() },
          $or: [{ endDate: null }, { endDate: { $gte: new Date() } }],
        },
        {
          sort: { startDate: -1 },
        },
      );
    } catch (error) {
      this.handleServiceError(error, 'find discounts by student');
    }
  }

  async update(
    connection: Connection,
    id: string,
    updateDto: UpdateStudentDiscountDto,
    syncWithFees: boolean = true,
  ): Promise<StudentDiscount> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid discount ID: ${id}`);
      }

      const repository = this.getRepository(connection);
      const existingDiscount = await repository.findById(id);

      if (!existingDiscount) {
        throw new NotFoundException('Student discount not found');
      }

      if (
        updateDto.discountValueType === 'PERCENTAGE' &&
        updateDto.discountValue > 100
      ) {
        throw new BadRequestException(
          'Percentage discount cannot be greater than 100%',
        );
      }

      if (updateDto.studentId) {
        if (!Types.ObjectId.isValid(updateDto.studentId)) {
          throw new BadRequestException(
            `Invalid studentId: ${updateDto.studentId}`,
          );
        }
        await this.validateStudent(connection, updateDto.studentId);
      }

      if (updateDto.applicableCategories?.length) {
        for (const categoryId of updateDto.applicableCategories) {
          if (!Types.ObjectId.isValid(categoryId)) {
            throw new BadRequestException(
              `Invalid fee category ID: ${categoryId}`,
            );
          }
        }
        await this.validateFeeCategories(
          connection,
          updateDto.applicableCategories,
        );
      }

      // Check for overlapping discounts if dates or type are being updated
      if (updateDto.startDate || updateDto.endDate || updateDto.discountType) {
        await this.validateNoOverlappingDiscounts(
          connection,
          updateDto.studentId || existingDiscount.studentId.toString(),
          updateDto.discountType || existingDiscount.discountType,
          updateDto.startDate || existingDiscount.startDate,
          updateDto.endDate !== undefined
            ? updateDto.endDate
            : existingDiscount.endDate,
          id,
        );
      }

      // Store the studentId before update for syncing
      const studentId =
        updateDto.studentId || existingDiscount.studentId.toString();
      const wasActive =
        existingDiscount.isActive &&
        existingDiscount.startDate <= new Date() &&
        (!existingDiscount.endDate || existingDiscount.endDate >= new Date());

      const updatedDiscount = await repository.findByIdAndUpdate(id, {
        ...updateDto,
        ...(updateDto.studentId && {
          studentId: Types.ObjectId.createFromHexString(updateDto.studentId),
        }),
        ...(updateDto.applicableCategories && {
          applicableCategories: updateDto.applicableCategories.map((id) =>
            Types.ObjectId.createFromHexString(id),
          ),
        }),
      });

      // Check if discount properties that affect fee calculations were changed
      const needsSync =
        updateDto.discountValue !== undefined ||
        updateDto.discountValueType !== undefined ||
        updateDto.applicableCategories !== undefined ||
        updateDto.endDate !== undefined;

      // Sync with fees if needed
      if (syncWithFees && needsSync) {
        const isNowActive =
          updatedDiscount.isActive &&
          updatedDiscount.startDate <= new Date() &&
          (!updatedDiscount.endDate || updatedDiscount.endDate >= new Date());

        // Only sync if the discount is currently active or was active before the update
        if (isNowActive || wasActive) {
          await this.studentFeeService.synchronizeDiscountsForStudent(
            connection,
            studentId,
          );
        }
      }

      return updatedDiscount;
    } catch (error) {
      this.handleServiceError(error, 'update student discount');
    }
  }

  async remove(
    connection: Connection,
    id: string,
    syncWithFees: boolean = true,
  ): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid discount ID: ${id}`);
      }

      const repository = this.getRepository(connection);
      const discount = await repository.findById(id);

      if (!discount) {
        throw new NotFoundException('Student discount not found');
      }

      // Check if discount is being used in any active fees
      const isUsed = await this.checkDiscountUsage(connection, id);
      if (isUsed) {
        throw new ConflictException(
          'Cannot delete discount as it is being used in active fee records',
        );
      }

      // Store studentId for syncing before deletion
      const studentId = discount.studentId.toString();
      const wasActive =
        discount.isActive &&
        discount.startDate <= new Date() &&
        (!discount.endDate || discount.endDate >= new Date());

      // Remove discount
      const result = await repository.delete(id);

      // Sync with fees if the discount was active
      if (syncWithFees && wasActive) {
        await this.studentFeeService.synchronizeDiscountsForStudent(
          connection,
          studentId,
        );
      }

      return result;
    } catch (error) {
      this.handleServiceError(error, 'remove student discount');
    }
  }

  async getActiveDiscounts(
    connection: Connection,
    studentId: string,
    date: Date = new Date(),
  ): Promise<StudentDiscount[]> {
    try {
      if (!Types.ObjectId.isValid(studentId)) {
        throw new BadRequestException(`Invalid studentId: ${studentId}`);
      }

      const repository = this.getRepository(connection);
      return repository.findWithOptions(
        {
          studentId: Types.ObjectId.createFromHexString(studentId),
          isActive: true,
          startDate: { $lte: date },
          $or: [{ endDate: null }, { endDate: { $gte: date } }],
        },
        {
          sort: { startDate: -1 },
        },
      );
    } catch (error) {
      this.handleServiceError(error, 'get active discounts');
    }
  }

  async toggleDiscountStatus(
    connection: Connection,
    id: string,
    syncWithFees: boolean = true,
  ): Promise<StudentDiscount> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid discount ID: ${id}`);
      }

      const repository = this.getRepository(connection);
      const discount = await repository.findById(id);

      if (!discount) {
        throw new NotFoundException('Student discount not found');
      }

      // Toggle the status
      const updatedDiscount = await repository.findByIdAndUpdate(id, {
        isActive: !discount.isActive,
      });

      // Sync with fees if the status change affects active discounts
      if (
        syncWithFees &&
        discount.startDate <= new Date() &&
        (!discount.endDate || discount.endDate >= new Date())
      ) {
        await this.studentFeeService.synchronizeDiscountsForStudent(
          connection,
          discount.studentId.toString(),
        );
      }

      return updatedDiscount;
    } catch (error) {
      this.handleServiceError(error, 'toggle discount status');
    }
  }

  // Synchronize a single discount with all applicable student fees
  async synchronizeFeesForDiscount(
    connection: Connection,
    discountId: string,
  ): Promise<{ updated: number }> {
    try {
      if (!Types.ObjectId.isValid(discountId)) {
        throw new BadRequestException(`Invalid discount ID: ${discountId}`);
      }

      const repository = this.getRepository(connection);
      const discount = await repository.findById(discountId);

      if (!discount) {
        throw new NotFoundException('Student discount not found');
      }

      // Skip if discount is not active or not applicable yet
      if (
        !discount.isActive ||
        discount.startDate > new Date() ||
        (discount.endDate && discount.endDate < new Date())
      ) {
        return { updated: 0 };
      }

      return this.studentFeeService.synchronizeDiscountsForStudent(
        connection,
        discount.studentId.toString(),
      );
    } catch (error) {
      this.handleServiceError(error, 'synchronize fees for discount');
    }
  }

  async synchronizeDiscountsForStudent(
    connection: Connection,
    studentId: string,
  ): Promise<{ updated: number }> {
    return this.studentFeeService.synchronizeDiscountsForStudent(
      connection,
      studentId,
    );
  }

  private async validateStudent(
    connection: Connection,
    studentId: string,
  ): Promise<void> {
    try {
      const studentRepo = connection.model('Student', StudentSchema);
      const student = await studentRepo.findOne({
        _id: Types.ObjectId.createFromHexString(studentId),
        status: 'Active',
      });

      if (!student) {
        throw new BadRequestException('Student not found or inactive');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.warn(
        'Skipping student validation due to model error:',
        error.message,
      );
    }
  }

  private async validateFeeCategories(
    connection: Connection,
    categoryIds: string[],
  ): Promise<void> {
    const categories = await Promise.all(
      categoryIds.map((id) =>
        this.feeCategoryService
          .getFeeCategoryById(connection, id)
          .catch(() => null),
      ),
    );

    const invalidCategories = categories.filter((c) => !c || !c.isActive);
    if (invalidCategories.length > 0) {
      throw new BadRequestException(
        'One or more fee categories are invalid or inactive',
      );
    }
  }

  private async validateNoOverlappingDiscounts(
    connection: Connection,
    studentId: string,
    discountType: string,
    startDate: Date,
    endDate?: Date,
    excludeId?: string,
  ): Promise<void> {
    const repository = this.getRepository(connection);
    const maxDate = new Date(9999, 11, 31); // Clear representation of "far future" date

    // Create a query that checks if date ranges overlap
    const query: Record<string, any> = {
      studentId: Types.ObjectId.createFromHexString(studentId),
      discountType,
      isActive: true,
    };

    // Add date overlap conditions
    query.$or = [
      // New start date falls within existing range
      {
        startDate: { $lte: startDate },
        $or: [{ endDate: null }, { endDate: { $gte: startDate } }],
      },
      // New end date (or infinity) falls within existing range
      {
        startDate: { $lte: endDate || maxDate },
        $or: [{ endDate: null }, { endDate: { $gte: endDate || maxDate } }],
      },
      // New range completely contains existing range
      {
        startDate: { $gte: startDate },
        $or: [{ endDate: null }, { endDate: { $lte: endDate || maxDate } }],
      },
    ];

    if (excludeId) {
      query._id = { $ne: Types.ObjectId.createFromHexString(excludeId) };
    }

    const existingDiscount = await repository.findOne(query);
    if (existingDiscount) {
      throw new ConflictException(
        'An overlapping discount of the same type already exists for this period',
      );
    }
  }

  private async checkDiscountUsage(
    connection: Connection,
    discountId: string,
  ): Promise<boolean> {
    try {
      const studentFeeRepo = connection.model('StudentFee', studentFeeSchema);
      const count = await studentFeeRepo.countDocuments({
        'feeDetails.discountId': Types.ObjectId.createFromHexString(discountId),
        status: { $in: ['PENDING', 'PARTIAL'] },
      });
      return count > 0;
    } catch (error) {
      console.warn('Error checking discount usage:', error.message);
      return false;
    }
  }
}
