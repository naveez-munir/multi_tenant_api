import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { BaseService } from '../../../../common/services/base.service';
import { StudentFee, studentFeeSchema } from '../../schemas/student-fee.schema';
import { GenerateStudentFeeDto } from '../dto/generate-student-fee.dto';
import { ApplyDiscountDto, BulkGenerateStudentFeeDto } from '../dto/student-fee.dto';
import { FeeStructureService } from './fee-structure.service';
import { StudentSchema } from 'src/modules/student/schemas/student.schema';
import { StudentDiscount, studentDiscountSchema } from '../../schemas/student-discount.schema';
import { feeStructureSchema } from '../../schemas/fee-structure.schema';

@Injectable()
export class StudentFeeService extends BaseService<StudentFee> {
  constructor(
    private readonly feeStructureService: FeeStructureService
  ) {
    super('StudentFee', studentFeeSchema);
  }

  private handleServiceError(error: any, operationName: string): never {
    if (error instanceof BadRequestException || 
        error instanceof ConflictException || 
        error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(`Failed to ${operationName}: ${error.message}`);
  }

  async generateStudentFee(
    connection: Connection,
    generateDto: GenerateStudentFeeDto
  ): Promise<StudentFee> {
    try {
      const repository = this.getRepository(connection);
      
      if (!Types.ObjectId.isValid(generateDto.studentId)) {
        throw new BadRequestException(`Invalid studentId: ${generateDto.studentId}`);
      }
      
      if (!Types.ObjectId.isValid(generateDto.feeStructureId)) {
        throw new BadRequestException(`Invalid feeStructureId: ${generateDto.feeStructureId}`);
      }
      
      await this.validateStudent(connection, generateDto.studentId);
      
      const feeStructure = await this.feeStructureService.getFeeStructureById(
        connection,
        generateDto.feeStructureId
      );

      const dueDate = this.calculateDueDate(
        generateDto.billType,
        generateDto.billMonth,
        generateDto.quarter,
        feeStructure.feeComponents[0]?.dueDay || 10
      );

      const feeDetails = feeStructure.feeComponents.map(component => ({
        feeCategory: component.feeCategory,
        originalAmount: component.amount,
        netAmount: component.amount,
        paidAmount: 0,
        dueAmount: component.amount
      }));

      const totalAmount = feeDetails.reduce((sum, detail) => sum + detail.originalAmount, 0);

      const studentFee = await repository.create({
        studentId: Types.ObjectId.createFromHexString(generateDto.studentId),
        feeStructureId: Types.ObjectId.createFromHexString(generateDto.feeStructureId),
        academicYear: feeStructure.academicYear,
        billType: generateDto.billType,
        billMonth: generateDto.billMonth,
        quarter: generateDto.quarter,
        dueDate,
        feeDetails,
        totalAmount,
        netAmount: totalAmount,
        dueAmount: totalAmount,
        status: 'PENDING'
      });

      return this.applyAutomaticDiscounts(connection, studentFee._id.toString());

    } catch (error) {
      this.handleServiceError(error, 'generate student fee');
    }
  }

  async generateRecurringFees(
    connection: Connection,
    options: {
      academicYear: string;
      month?: number;
      quarter?: number;
      billType: string;
    }
  ): Promise<{ generated: number; skipped: number }> {
    try {
      const { academicYear, month, quarter, billType } = options;
      const feeStructureRepo = connection.model('FeeStructure', feeStructureSchema);
      const feeStructures = await feeStructureRepo.find({
        academicYear,
        isActive: true
      });
      
      const studentRepo = connection.model('Student', StudentSchema);
      const students = await studentRepo.find({ 
        status: 'Active'
      });
      
      const studentsByClass = students.reduce((acc, student) => {
        const classId = student.class.toString();
        if (!acc[classId]) acc[classId] = [];
        acc[classId].push(student);
        return acc;
      }, {});
      let generated = 0;
      let skipped = 0;
      for (const structure of feeStructures) {
        console.log('>>>>>>>>>>>',structure.academicYear)
        const classId = structure.classId.toString();
        const studentsInClass = studentsByClass[classId] || [];
        
        if (studentsInClass.length === 0) continue;
        
        for (const student of studentsInClass) {
          const existingFee = await this.getRepository(connection).findOne({
            studentId: student._id,
            feeStructureId: structure._id,
            academicYear,
            billType,
            ...(billType === 'MONTHLY' ? { billMonth: month } : {}),
            ...(billType === 'QUARTERLY' ? { quarter } : {})
          });
          
          if (existingFee) {
            skipped++;
            continue;
          }
          
          await this.generateStudentFee(connection, {
            studentId: student._id.toString(),
            feeStructureId: structure._id.toString(),
            academicYear,
            billType,
            billMonth: month,
            quarter
          });
          
          generated++;
        }
      }
      return { generated, skipped };
    } catch (error) {
      this.handleServiceError(error, 'generate recurring fees');
    }
  }

  private async validateStudent(connection: Connection, studentId: string): Promise<void> {
    try {
      const studentRepo = connection.model('Student', StudentSchema);
      const student = await studentRepo.findOne({ 
        _id: Types.ObjectId.createFromHexString(studentId),
        status: 'Active'
      });
      
      if (!student) {
        throw new BadRequestException('Student not found or not active');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.warn('Warning in student validation:', error.message);
    }
  }

  async bulkGenerateStudentFees(
    connection: Connection,
    bulkGenerateDto: BulkGenerateStudentFeeDto
  ): Promise<StudentFee[]> {
    try {
      if (!Types.ObjectId.isValid(bulkGenerateDto.feeStructureId)) {
        throw new BadRequestException(`Invalid feeStructureId: ${bulkGenerateDto.feeStructureId}`);
      }
      
      for (const studentId of bulkGenerateDto.studentIds) {
        if (!Types.ObjectId.isValid(studentId)) {
          throw new BadRequestException(`Invalid studentId: ${studentId}`);
        }
      }
      
      const feeStructure = await this.feeStructureService.getFeeStructureById(
        connection,
        bulkGenerateDto.feeStructureId
      );

      const studentFees = await Promise.all(
        bulkGenerateDto.studentIds.map(studentId =>
          this.generateStudentFee(connection, {
            studentId,
            feeStructureId: bulkGenerateDto.feeStructureId,
            academicYear: bulkGenerateDto.academicYear || feeStructure.academicYear,
            billType: bulkGenerateDto.billType,
            billMonth: bulkGenerateDto.billMonth,
            quarter: null
          }).catch(error => {
            console.error(`Error generating fee for student ${studentId}:`, error);
            return null;
          })
        )
      );

      return studentFees.filter(Boolean);
    } catch (error) {
      this.handleServiceError(error, 'bulk generate student fees');
    }
  }

  async getStudentFees(
    connection: Connection,
    studentId: string,
    filters: {
      academicYear?: string;
      status?: string;
      billType?: string;
    }
  ): Promise<StudentFee[]> {
    try {
      if (!Types.ObjectId.isValid(studentId)) {
        throw new BadRequestException(`Invalid studentId: ${studentId}`);
      }

      const repository = this.getRepository(connection);
      const query: Record<string, any> = {
        studentId: Types.ObjectId.createFromHexString(studentId)
      };

      if (filters.academicYear) query.academicYear = filters.academicYear;
      if (filters.status) query.status = filters.status;
      if (filters.billType) query.billType = filters.billType;

      return repository.findWithOptions(query, {
        sort: { dueDate: 1 }
      });
    } catch (error) {
      this.handleServiceError(error, 'get student fees');
    }
  }

  async getStudentFeeById(
    connection: Connection,
    id: string
  ): Promise<StudentFee> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid fee id: ${id}`);
      }

      const repository = this.getRepository(connection);
      const studentFee = await repository.findById(id);

      if (!studentFee) {
        throw new NotFoundException('Student fee not found');
      }

      return studentFee;
    } catch (error) {
      this.handleServiceError(error, 'get student fee by id');
    }
  }

  async applyDiscount(
    connection: Connection,
    id: string,
    discountDto: ApplyDiscountDto
  ): Promise<StudentFee> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid fee id: ${id}`);
      }

      if (!Types.ObjectId.isValid(discountDto.feeCategoryId)) {
        throw new BadRequestException(`Invalid fee category id: ${discountDto.feeCategoryId}`);
      }

      const repository = this.getRepository(connection);
      const studentFee = await this.getStudentFeeById(connection, id);

      if (studentFee.status === 'CANCELLED') {
        throw new BadRequestException('Cannot apply discount to a cancelled fee');
      }

      if (studentFee.status === 'PAID') {
        throw new BadRequestException('Cannot apply discount to a fully paid fee');
      }

      const feeDetail = studentFee.feeDetails.find(
        detail => detail.feeCategory.toString() === discountDto.feeCategoryId
      );

      if (!feeDetail) {
        throw new BadRequestException('Fee category not found in student fee');
      }

      if (feeDetail.paidAmount > 0) {
        throw new BadRequestException('Cannot apply discount after payment has been made');
      }

      feeDetail.discountType = discountDto.discountType;
      feeDetail.discountAmount = discountDto.discountAmount;
      feeDetail.netAmount = feeDetail.originalAmount - discountDto.discountAmount;
      feeDetail.dueAmount = feeDetail.netAmount - feeDetail.paidAmount;

      studentFee.totalDiscount = studentFee.feeDetails.reduce(
        (sum, detail) => sum + (detail.discountAmount || 0),
        0
      );
      studentFee.netAmount = studentFee.totalAmount - studentFee.totalDiscount;
      studentFee.dueAmount = studentFee.netAmount - studentFee.paidAmount;

      const updated = await repository.findByIdAndUpdate(id, studentFee);
      return updated;
    } catch (error) {
      this.handleServiceError(error, 'apply discount');
    }
  }

  async cancelStudentFee(
    connection: Connection,
    id: string,
    reason: string
  ): Promise<StudentFee> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid fee id: ${id}`);
      }

      if (!reason || reason.trim() === '') {
        throw new BadRequestException('Cancellation reason is required');
      }

      const repository = this.getRepository(connection);
      const studentFee = await this.getStudentFeeById(connection, id);

      if (studentFee.status === 'CANCELLED') {
        throw new BadRequestException('Fee is already cancelled');
      }

      if (studentFee.paidAmount > 0) {
        throw new BadRequestException('Cannot cancel fee after payment has been made');
      }

      const updated = await repository.findByIdAndUpdate(id, {
        status: 'CANCELLED',
        remarks: reason
      });

      return updated;
    } catch (error) {
      this.handleServiceError(error, 'cancel student fee');
    }
  }

  async getPendingFees(
    connection: Connection,
    query: { academicYear?: string; classId?: string }
  ): Promise<{ fees: StudentFee[], summary: any }> {
    try {
      const repository = this.getRepository(connection);
      const filter: Record<string, any> = {
        status: { $in: ['PENDING', 'PARTIAL'] }
      };
  
      if (query.academicYear) filter.academicYear = query.academicYear;
      
      if (query.classId) {
        if (!Types.ObjectId.isValid(query.classId)) {
          throw new BadRequestException(`Invalid classId: ${query.classId}`);
        }
        
        const studentRepo = connection.model('Student', StudentSchema);
        const students = await studentRepo.find({ 
          classId: Types.ObjectId.createFromHexString(query.classId) 
        });
        
        if (students.length === 0) {
          return { 
            fees: [], 
            summary: { totalPending: 0, totalOverdue: 0, count: 0 } 
          };
        }
        
        filter.studentId = { $in: students.map(s => s._id) };
      }
  
      const fees = await repository.findWithOptions(filter, {
        sort: { dueDate: 1 }
      });
      
      const today = new Date();
  
      return {
        fees,
        summary: {
          totalPending: fees.reduce((sum, fee) => sum + fee.dueAmount, 0),
          totalOverdue: fees.reduce((sum, fee) => 
            fee.dueDate < today ? sum + fee.dueAmount : sum, 0
          ),
          count: fees.length
        }
      };
    } catch (error) {
      this.handleServiceError(error, 'get pending fees');
    }
  }
  
  async getOverdueFees(
    connection: Connection,
    query: { academicYear?: string; classId?: string }
  ): Promise<StudentFee[]> {
    try {
      const repository = this.getRepository(connection);
      const filter: Record<string, any> = {
        status: { $in: ['PENDING', 'PARTIAL'] },
        dueDate: { $lt: new Date() }
      };
  
      if (query.academicYear) filter.academicYear = query.academicYear;
      
      if (query.classId) {
        if (!Types.ObjectId.isValid(query.classId)) {
          throw new BadRequestException(`Invalid classId: ${query.classId}`);
        }
        
        const studentRepo = connection.model('Student', StudentSchema);
        const students = await studentRepo.find({ 
          classId: Types.ObjectId.createFromHexString(query.classId) 
        });
        
        if (students.length === 0) {
          return [];
        }
        
        filter.studentId = { $in: students.map(s => s._id) };
      }
  
      return repository.findWithOptions(filter, {
        sort: { dueDate: 1 }
      });
    } catch (error) {
      this.handleServiceError(error, 'get overdue fees');
    }
  }

  async calculateLateFees(
    connection: Connection,
    date: Date = new Date()
  ): Promise<number> {
    try {
      const repository = this.getRepository(connection);
      
      const overdueFees = await repository.find({
        status: { $in: ['PENDING', 'PARTIAL'] },
        dueDate: { $lt: date }
      });
      
      let updatedCount = 0;
      
      for (const fee of overdueFees) {
        const feeStructure = await this.feeStructureService.getFeeStructureById(
          connection, 
          fee.feeStructureId.toString()
        );
        
        const daysOverdue = Math.floor((date.getTime() - fee.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let totalLateCharges = 0;
        
        for (const detail of fee.feeDetails) {
          const component = feeStructure.feeComponents.find(
            c => c.feeCategory.toString() === detail.feeCategory.toString()
          );
          
          if (component && daysOverdue > (component.gracePeriod || 0)) {
            let lateCharge = 0;
            
            if (component.lateChargeType === 'PERCENTAGE') {
              lateCharge = (detail.netAmount * component.lateChargeValue / 100);
            } else {
              lateCharge = component.lateChargeValue || 0;
            }
            
            detail.lateCharges = lateCharge;
            detail.dueAmount = detail.netAmount - detail.paidAmount + lateCharge;
            totalLateCharges += lateCharge;
          }
        }
        
        if (totalLateCharges > 0) {
          fee.lateCharges = totalLateCharges;
          fee.dueAmount = fee.netAmount - fee.paidAmount + totalLateCharges;
          fee.status = 'OVERDUE';
          
          await repository.findByIdAndUpdate(fee._id.toString(), fee);
          updatedCount++;
        }
      }
      
      return updatedCount;
    } catch (error) {
      this.handleServiceError(error, 'calculate late fees');
    }
  }

  async updateFeeStatuses(
    connection: Connection
  ): Promise<number> {
    try {
      const repository = this.getRepository(connection);
      const today = new Date();
      
      const fees = await repository.find({
        status: { $in: ['PENDING', 'PARTIAL'] }
      });
      
      let updatedCount = 0;
      
      for (const fee of fees) {
        let statusChanged = false;
        let newStatus = fee.status;
        
        if (fee.dueDate < today && fee.status === 'PENDING') {
          newStatus = 'OVERDUE';
          statusChanged = true;
        }
        
        if (fee.paidAmount >= fee.netAmount && fee.status !== 'PAID') {
          newStatus = 'PAID';
          statusChanged = true;
        }
        
        if (fee.paidAmount > 0 && fee.paidAmount < fee.netAmount && 
            fee.status === 'PENDING') {
          newStatus = 'PARTIAL';
          statusChanged = true;
        }
        
        if (statusChanged) {
          await repository.findByIdAndUpdate(fee._id.toString(), { status: newStatus });
          updatedCount++;
        }
      }
      
      return updatedCount;
    } catch (error) {
      this.handleServiceError(error, 'update fee statuses');
    }
  }

  async applyAutomaticDiscounts(
    connection: Connection,
    feeId: string
  ): Promise<StudentFee> {
    try {
      const repository = this.getRepository(connection);
      const studentFee = await this.getStudentFeeById(connection, feeId);
      
      if (studentFee.status === 'CANCELLED' || studentFee.status === 'PAID') {
        return studentFee;
      }
      
      const hasPayments = studentFee.feeDetails.some(detail => detail.paidAmount > 0);
      if (hasPayments) {
        return studentFee;
      }
      
      const activeDiscounts = await this.getActiveDiscountsForStudent(
        connection,
        studentFee.studentId.toString()
      );
      
      if (activeDiscounts.length === 0) {
        return studentFee;
      }
      
      let totalDiscountAmount = 0;
      
      for (const detail of studentFee.feeDetails) {
        for (const discount of activeDiscounts) {
          if (discount.applicableCategories && 
              discount.applicableCategories.length > 0 &&
              !discount.applicableCategories.some(c => 
                c.toString() === detail.feeCategory.toString()
              )) {
            continue;
          }
          
          let discountAmount = 0;
          if (discount.discountValueType === 'PERCENTAGE') {
            discountAmount = Math.round(detail.originalAmount * discount.discountValue / 100);
          } else {
            discountAmount = Math.min(discount.discountValue, detail.originalAmount);
          }
          
          detail.discountType = discount.discountType;
          detail.discountAmount = discountAmount;
          detail.netAmount = detail.originalAmount - discountAmount;
          detail.dueAmount = detail.netAmount;
          
          totalDiscountAmount += discountAmount;
          
          detail.discountId = discount._id;
          
          break;
        }
      }
      
      if (totalDiscountAmount > 0) {
        studentFee.totalDiscount = totalDiscountAmount;
        studentFee.netAmount = studentFee.totalAmount - totalDiscountAmount;
        studentFee.dueAmount = studentFee.netAmount;
        
        const updated = await repository.findByIdAndUpdate(feeId, studentFee);
        return updated;
      }
      
      return studentFee;
    } catch (error) {
      this.handleServiceError(error, 'apply automatic discounts');
    }
  }

  async synchronizeDiscountsForStudent(
    connection: Connection,
    studentId: string
  ): Promise<{ updated: number }> {
    try {
      if (!Types.ObjectId.isValid(studentId)) {
        throw new BadRequestException(`Invalid studentId: ${studentId}`);
      }
      
      const repository = this.getRepository(connection);
      
      const fees = await repository.find({
        studentId: Types.ObjectId.createFromHexString(studentId),
        status: { $in: ['PENDING', 'PARTIAL'] },
        paidAmount: 0
      });
      
      let updatedCount = 0;
      
      for (const fee of fees) {
        const beforeDiscount = fee.totalDiscount || 0;
        await this.applyAutomaticDiscounts(connection, fee._id.toString());
        const afterDiscount = (await this.getStudentFeeById(connection, fee._id.toString())).totalDiscount || 0;
        
        if (beforeDiscount !== afterDiscount) {
          updatedCount++;
        }
      }
      
      return { updated: updatedCount };
    } catch (error) {
      this.handleServiceError(error, 'synchronize discounts for student');
    }
  }

  async handleDiscountChange(
    connection: Connection,
    studentId: string,
    updateExistingFees: boolean = false
  ): Promise<{ updated: number }> {
    try {
      if (!updateExistingFees) {
        return { updated: 0 };
      }
      
      return this.synchronizeDiscountsForStudent(connection, studentId);
    } catch (error) {
      this.handleServiceError(error, 'handle discount change');
    }
  }

  private async getActiveDiscountsForStudent(
    connection: Connection,
    studentId: string,
    date: Date = new Date()
  ): Promise<StudentDiscount[]> {
    try {
      const discountRepo = connection.model('StudentDiscount', studentDiscountSchema);
      
      return discountRepo.find({
        studentId: Types.ObjectId.createFromHexString(studentId),
        isActive: true,
        startDate: { $lte: date },
        $or: [
          { endDate: null },
          { endDate: { $gte: date } }
        ]
      }).sort({ startDate: -1 });
    } catch (error) {
      console.warn('Error getting active discounts:', error.message);
      return [];
    }
  }

  private calculateDueDate(
    billType: string,
    billMonth?: number,
    quarter?: number,
    dueDay: number = 10
  ): Date {
    const date = new Date();
    
    switch (billType) {
      case 'MONTHLY':
        if (!billMonth) throw new BadRequestException('Bill month is required for monthly fees');
        date.setMonth(billMonth - 1);
        break;
      case 'QUARTERLY':
        if (!quarter) throw new BadRequestException('Quarter is required for quarterly fees');
        date.setMonth((quarter - 1) * 3);
        break;
    }
    
    date.setDate(dueDay);
    return date;
  }
}
