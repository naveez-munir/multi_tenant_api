import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { BaseService } from '../../../common/services/base.service';
import { Leave, LeaveSchema } from '../schemas/leave.schema';
import { TeacherSchema } from 'src/modules/teacher/schemas/teacher.schema';
import { StaffSchema } from 'src/modules/staff/schema/staff.schema';
import { LeaveBalanceSchema } from '../schemas/leaveBalance.schema';
import { ApproveLeaveDto, CreateLeaveBalanceDto, CreateLeaveDto, LeaveBalanceResponseDto, LeaveResponseDto, SearchLeaveDto, UpdateLeaveBalanceDto, UpdateLeaveDto } from '../dto/leave.dto';

@Injectable()
export class LeaveService extends BaseService<Leave> {

  constructor() {
    super('Leave', LeaveSchema);
  }

  private async ensureInitialized(connection: Connection): Promise<void> {
    try {
      if (!connection.models['Teacher']) {
        connection.model('Teacher', TeacherSchema);
      }
      if (!connection.models['Staff']) {
        connection.model('Staff', StaffSchema);
      }
    } catch (error) {
      // Models already exist, ignore error
    }
  }

  private validateObjectId(id: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName} ID format`);
    }
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }
  }

  private async getEmployeeDetails(
    connection: Connection,
    employeeId: string,
    employeeType: string
  ): Promise<any> {
    const model = connection.models[employeeType];
    if (!model) {
      throw new BadRequestException(`Invalid employee type: ${employeeType}`);
    }

    const employee = await model.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`${employeeType} not found with ID ${employeeId}`);
    }

    return employee;
  }

  private async getEmployeeWithValidation(
    connection: Connection,
    employeeId: string,
    employeeType: string
  ): Promise<any> {
    this.validateObjectId(employeeId, 'employee');
    await this.ensureInitialized(connection);
    
    return this.getEmployeeDetails(connection, employeeId, employeeType);
  }

  private calculateLeaveDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset time part to ensure full day counting
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }

  private async checkLeaveOverlap(
    connection: Connection,
    employeeId: string,
    employeeType: string,
    startDate: Date,
    endDate: Date,
    excludeLeaveId?: string
  ): Promise<boolean> {
    const repository = this.getRepository(connection);
    const query: Record<string, any> = {
      employeeId: new Types.ObjectId(employeeId),
      employeeType,
      status: { $ne: 'CANCELLED' },
      $or: [
        // New leave start date falls within existing leave
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    };

    // Exclude the current leave when updating
    if (excludeLeaveId) {
      query._id = { $ne: new Types.ObjectId(excludeLeaveId) };
    }

    const overlappingLeaves = await repository.find(query);
    return overlappingLeaves.length > 0;
  }

  private getDefaultAllowances(employee: any): Record<string, number> {
    const defaults = {
      sickLeaveAllocation: 12,
      casualLeaveAllocation: 12,
      earnedLeaveAllocation: 0
    };
    
    // Override with employee specific values if available
    if (employee.sickLeaveAllowance !== undefined) {
      defaults.sickLeaveAllocation = employee.sickLeaveAllowance;
    }
    if (employee.casualLeaveAllowance !== undefined) {
      defaults.casualLeaveAllocation = employee.casualLeaveAllowance;
    }
    if (employee.earnedLeaveAllowance !== undefined) {
      defaults.earnedLeaveAllocation = employee.earnedLeaveAllowance;
    }
    
    return defaults;
  }

  private async getOrCreateLeaveBalance(
    connection: Connection, 
    employeeId: string, 
    employeeType: string, 
    year: number = new Date().getFullYear(),
    employee?: any
  ): Promise<any> {
    const balanceRepo = connection.model("LeaveBalance", LeaveBalanceSchema);
    
    let leaveBalance = await balanceRepo.findOne({
      employeeId: new Types.ObjectId(employeeId),
      employeeType,
      year,
      isActive: true
    });
    
    if (!leaveBalance) {
      // If employee not passed, fetch it
      if (!employee) {
        employee = await this.getEmployeeDetails(connection, employeeId, employeeType);
      }
      
      // Create default balance
      const defaultAllowances = this.getDefaultAllowances(employee);
      
      leaveBalance = await balanceRepo.create({
        employeeId: new Types.ObjectId(employeeId),
        employeeType,
        year,
        sickLeaveAllocation: defaultAllowances.sickLeaveAllocation,
        sickLeaveUsed: 0,
        casualLeaveAllocation: defaultAllowances.casualLeaveAllocation,
        casualLeaveUsed: 0,
        earnedLeaveAllocation: defaultAllowances.earnedLeaveAllocation,
        earnedLeaveUsed: 0,
        unpaidLeaveUsed: 0,
        isActive: true
      });
    }
    
    return leaveBalance;
  }

  private determineLeavePaymentStatus(
    leaveType: string,
    numberOfDays: number,
    leaveBalance: any
  ): boolean {
    if (leaveType === 'UNPAID') {
      return false;
    }
    
    let isPaid = true;
    if (leaveType === 'SICK') {
      const remaining = leaveBalance.sickLeaveAllocation - leaveBalance.sickLeaveUsed;
      isPaid = remaining >= numberOfDays;
    } else if (leaveType === 'CASUAL') {
      const remaining = leaveBalance.casualLeaveAllocation - leaveBalance.casualLeaveUsed;
      isPaid = remaining >= numberOfDays;
    } else if (leaveType === 'EARNED') {
      const remaining = leaveBalance.earnedLeaveAllocation - leaveBalance.earnedLeaveUsed;
      isPaid = remaining >= numberOfDays;
    }
    
    return isPaid;
  }

  private handleServiceError(error: any, operation: string): never {
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException ||
        error instanceof ConflictException) {
      throw error;
    }
    
    throw new BadRequestException(`Failed to ${operation}: ${error.message}`);
  }

  async createLeaveRequest(
    connection: Connection,
    createDto: CreateLeaveDto
  ): Promise<LeaveResponseDto> {
    try {
      await this.ensureInitialized(connection);
      this.validateObjectId(createDto.employeeId, 'employee');
      
      // Validate dates
      const startDate = new Date(createDto.startDate);
      const endDate = new Date(createDto.endDate);
      this.validateDateRange(startDate, endDate);
      
      // Get employee details to ensure it exists
      const employee = await this.getEmployeeDetails(
        connection, 
        createDto.employeeId, 
        createDto.employeeType
      );
      
      // Calculate number of days
      const numberOfDays = this.calculateLeaveDays(startDate, endDate);
      
      // Check for overlapping leave
      const hasOverlap = await this.checkLeaveOverlap(
        connection,
        createDto.employeeId,
        createDto.employeeType,
        startDate,
        endDate
      );

      if (hasOverlap) {
        throw new ConflictException('Employee already has approved or pending leave for this date range');
      }
      
      // Get or create leave balance
      const currentYear = new Date().getFullYear();
      const leaveBalance = await this.getOrCreateLeaveBalance(
        connection,
        createDto.employeeId,
        createDto.employeeType,
        currentYear,
        employee
      );

      // Determine if leave should be paid or unpaid based on balance
      const isPaid = this.determineLeavePaymentStatus(createDto.leaveType, numberOfDays, leaveBalance);

      // Create the leave request
      const leaveRepo = this.getRepository(connection);
      const leaveData = {
        ...createDto,
        employeeId: new Types.ObjectId(createDto.employeeId),
        startDate,
        endDate,
        numberOfDays,
        status: 'PENDING',
        isPaid,
        isDeductionApplied: false
      };

      // Create leave entity in the database
      const newLeave = await leaveRepo.create(leaveData);
      
      // Return formatted response
      return LeaveResponseDto.fromEntity(newLeave, employee);
    } catch (error) {
      this.handleServiceError(error, 'create leave request');
    }
  }

  async findLeaveById(
    connection: Connection,
    id: string
  ): Promise<LeaveResponseDto> {
    try {
      this.validateObjectId(id, 'leave');
      await this.ensureInitialized(connection);
      const repository = this.getRepository(connection);

      const leave = await repository.findById(id);
      if (!leave) {
        throw new NotFoundException('Leave not found');
      }

      // Get employee details
      const employee = await this.getEmployeeDetails(
        connection,
        leave.employeeId.toString(),
        leave.employeeType
      );

      // Get approver details if available
      let approver = null;
      if (leave.approvedBy) {
        try {
          approver = await this.getEmployeeDetails(
            connection,
            leave.approvedBy.toString(),
            leave.approverType
          );
        } catch (error) {
          // Ignore approver errors, just leave it as null
        }
      }

      return LeaveResponseDto.fromEntity(leave, employee, approver);
    } catch (error) {
      this.handleServiceError(error, 'fetch leave');
    }
  }

  async searchLeaves(
    connection: Connection,
    searchDto: SearchLeaveDto
  ): Promise<LeaveResponseDto[]> {
    try {
      await this.ensureInitialized(connection);
      const repository = this.getRepository(connection);
      const query: Record<string, any> = {};

      // Apply filters if provided
      if (searchDto.employeeId) {
        this.validateObjectId(searchDto.employeeId, 'employee');
        query.employeeId = new Types.ObjectId(searchDto.employeeId);
      }
      
      if (searchDto.employeeType) {
        query.employeeType = searchDto.employeeType;
      }
      
      if (searchDto.leaveType) {
        query.leaveType = searchDto.leaveType;
      }
      
      if (searchDto.status) {
        query.status = searchDto.status;
      }
      
      if (searchDto.approvedBy) {
        this.validateObjectId(searchDto.approvedBy, 'approver');
        query.approvedBy = new Types.ObjectId(searchDto.approvedBy);
      }
      
      if (searchDto.isPaid) {
        query.isPaid = searchDto.isPaid === 'true';
      }
      
      // Date range filters
      const dateFilters = [];
      
      if (searchDto.startDateFrom || searchDto.startDateTo) {
        const startDateFilter: Record<string, any> = {};
        
        if (searchDto.startDateFrom) {
          startDateFilter.$gte = new Date(searchDto.startDateFrom);
        }
        
        if (searchDto.startDateTo) {
          startDateFilter.$lte = new Date(searchDto.startDateTo);
        }
        
        dateFilters.push({ startDate: startDateFilter });
      }
      
      if (searchDto.endDateFrom || searchDto.endDateTo) {
        const endDateFilter: Record<string, any> = {};
        
        if (searchDto.endDateFrom) {
          endDateFilter.$gte = new Date(searchDto.endDateFrom);
        }
        
        if (searchDto.endDateTo) {
          endDateFilter.$lte = new Date(searchDto.endDateTo);
        }
        
        dateFilters.push({ endDate: endDateFilter });
      }
      
      // Combine date filters with main query if they exist
      if (dateFilters.length > 0) {
        query.$and = dateFilters;
      }

      // Execute query
      const leaves = await repository.find(query);
      
      // Get employee details for each leave
      const results = await Promise.all(
        leaves.map(async (leave) => {
          try {
            const employee = await this.getEmployeeDetails(
              connection,
              leave.employeeId.toString(),
              leave.employeeType
            );
            
            let approver = null;
            if (leave.approvedBy) {
              try {
                approver = await this.getEmployeeDetails(
                  connection,
                  leave.approvedBy.toString(),
                  leave.approverType
                );
              } catch (error) {
                // Ignore approver errors
              }
            }
            
            return LeaveResponseDto.fromEntity(leave, employee, approver);
          } catch (error) {
            // If employee not found, return leave without employee details
            return LeaveResponseDto.fromEntity(leave);
          }
        })
      );
      
      return results;
    } catch (error) {
      this.handleServiceError(error, 'search leaves');
    }
  }

  async findAllByEmployee(
    connection: Connection,
    employeeId: string,
    employeeType: string
  ): Promise<LeaveResponseDto[]> {
    try {
      const employee = await this.getEmployeeWithValidation(connection, employeeId, employeeType);
      
      const repository = this.getRepository(connection);
      const leaves = await repository.find({
        employeeId: new Types.ObjectId(employeeId),
        employeeType
      });
      
      return leaves.map(leave => {
        return LeaveResponseDto.fromEntity(leave, employee);
      });
    } catch (error) {
      this.handleServiceError(error, 'fetch employee leaves');
    }
  }

  async updateLeave(
    connection: Connection,
    id: string,
    updateDto: UpdateLeaveDto
  ): Promise<LeaveResponseDto> {
    try {
      this.validateObjectId(id, 'leave');
      await this.ensureInitialized(connection);
      const repository = this.getRepository(connection);
      
      // Get current leave to check status
      const currentLeave = await repository.findById(id);
      if (!currentLeave) {
        throw new NotFoundException('Leave not found');
      }
      
      // Only allow updates to pending leaves
      if (currentLeave.status !== 'PENDING') {
        throw new BadRequestException(`Cannot update leave with status ${currentLeave.status}`);
      }
      
      const updateData: Record<string, any> = { ...updateDto };
      
      // Handle date changes
      let numberOfDays = currentLeave.numberOfDays;
      if (updateDto.startDate || updateDto.endDate) {
        const startDate = updateDto.startDate ? new Date(updateDto.startDate) : currentLeave.startDate;
        const endDate = updateDto.endDate ? new Date(updateDto.endDate) : currentLeave.endDate;
        
        this.validateDateRange(startDate, endDate);
        
        // Calculate new number of days
        numberOfDays = this.calculateLeaveDays(startDate, endDate);
        updateData.numberOfDays = numberOfDays;
        
        // Check for overlapping leave
        const hasOverlap = await this.checkLeaveOverlap(
          connection,
          currentLeave.employeeId.toString(),
          currentLeave.employeeType,
          startDate,
          endDate,
          id
        );

        if (hasOverlap) {
          throw new ConflictException('Employee already has approved or pending leave for this date range');
        }
      }
      
      // Update leave
      await repository.findByIdAndUpdate(id, updateData);
      
      // Get updated leave with employee details
      return this.findLeaveById(connection, id);
    } catch (error) {
      this.handleServiceError(error, 'update leave');
    }
  }

  private async updateLeaveBalanceOnApproval(
    connection: Connection,
    leave: Leave
  ): Promise<void> {
    const balanceRepo = connection.model("LeaveBalance", LeaveBalanceSchema);
    const year = new Date(leave.startDate).getFullYear();
    
    // Get current balance
    let balance = await balanceRepo.findOne({
      employeeId: leave.employeeId,
      employeeType: leave.employeeType,
      year,
      isActive: true
    });
    
    if (!balance) {
      // Should not happen as balance is created during leave request
      throw new NotFoundException('Leave balance not found');
    }
    
    // Determine which balance to update based on leave type
    const updateData: Record<string, any> = {};
    
    if (leave.leaveType === 'SICK') {
      updateData.sickLeaveUsed = balance.sickLeaveUsed + leave.numberOfDays;
    } else if (leave.leaveType === 'CASUAL') {
      updateData.casualLeaveUsed = balance.casualLeaveUsed + leave.numberOfDays;
    } else if (leave.leaveType === 'EARNED') {
      updateData.earnedLeaveUsed = balance.earnedLeaveUsed + leave.numberOfDays;
    } else if (leave.leaveType === 'UNPAID') {
      updateData.unpaidLeaveUsed = balance.unpaidLeaveUsed + leave.numberOfDays;
    }
    
    // Update balance
    await balanceRepo.findByIdAndUpdate(balance._id, updateData);
  }

  async approveLeave(
    connection: Connection,
    id: string,
    approveDto: ApproveLeaveDto
  ): Promise<LeaveResponseDto> {
    try {
      this.validateObjectId(id, 'leave');
      this.validateObjectId(approveDto.approvedBy, 'approver');
      
      await this.ensureInitialized(connection);
      const repository = this.getRepository(connection);
      
      // Get current leave
      const currentLeave = await repository.findById(id);
      if (!currentLeave) {
        throw new NotFoundException('Leave not found');
      }
      
      // Only allow approval for pending leaves
      if (currentLeave.status !== 'PENDING') {
        throw new BadRequestException(`Cannot approve/reject leave with status ${currentLeave.status}`);
      }
      
      // Verify approver exists
      const approver = await this.getEmployeeDetails(
        connection,
        approveDto.approvedBy,
        approveDto.approverType
      );
      
      // Update leave status
      const updateData = {
        status: approveDto.status,
        approvedBy: new Types.ObjectId(approveDto.approvedBy),
        approverType: approveDto.approverType,
        approvalDate: new Date(),
        comments: approveDto.comments || ''
      };
      
      await repository.findByIdAndUpdate(id, updateData);
      
      // If approved, update leave balance
      if (approveDto.status === 'APPROVED') {
        await this.updateLeaveBalanceOnApproval(
          connection,
          currentLeave
        );
      }

      const employee = await this.getEmployeeDetails(
        connection,
        currentLeave.employeeId.toString(),
        currentLeave.employeeType
      );
      
      const updatedLeave = await repository.findById(id);
      return LeaveResponseDto.fromEntity(updatedLeave, employee, approver);
    } catch (error) {
      this.handleServiceError(error, 'approve leave');
    }
  }

  async cancelLeave(
    connection: Connection,
    id: string
  ): Promise<boolean> {
    try {
      this.validateObjectId(id, 'leave');
      await this.ensureInitialized(connection);
      const repository = this.getRepository(connection);
      
      // Get current leave
      const currentLeave = await repository.findById(id);
      if (!currentLeave) {
        throw new NotFoundException('Leave not found');
      }
      
      // Only allow cancellation for pending leaves
      if (currentLeave.status !== 'PENDING') {
        throw new BadRequestException(`Cannot cancel leave with status ${currentLeave.status}`);
      }
      await repository.findByIdAndUpdate(id, { status: 'CANCELLED' });
      
      return true;
    } catch (error) {
      this.handleServiceError(error, 'cancel leave');
    }
  }

  async createLeaveBalance(
    connection: Connection,
    createDto: CreateLeaveBalanceDto
  ): Promise<LeaveBalanceResponseDto> {
    try {
      const employee = await this.getEmployeeWithValidation(
        connection,
        createDto.employeeId,
        createDto.employeeType
      );
      
      const repository = connection.model('LeaveBalance', LeaveBalanceSchema);
      
      // Check for existing balance for this employee/year
      const existingBalance = await repository.findOne({
        employeeId: new Types.ObjectId(createDto.employeeId),
        employeeType: createDto.employeeType,
        year: createDto.year,
        isActive: true
      });
      
      if (existingBalance) {
        throw new ConflictException(`Leave balance already exists for this employee for year ${createDto.year}`);
      }
      
      // Create leave balance
      const balanceData = {
        ...createDto,
        employeeId: new Types.ObjectId(createDto.employeeId),
        sickLeaveUsed: 0,
        casualLeaveUsed: 0,
        earnedLeaveUsed: 0,
        unpaidLeaveUsed: 0,
        isActive: true
      };
      
      const newBalance = await repository.create(balanceData);
      return LeaveBalanceResponseDto.fromEntity(newBalance, employee);
    } catch (error) {
      this.handleServiceError(error, 'create leave balance');
    }
  }

  async getLeaveBalance(
    connection: Connection,
    employeeId: string,
    employeeType: string,
    year: number
  ): Promise<LeaveBalanceResponseDto> {
    try {
      const employee = await this.getEmployeeWithValidation(connection, employeeId, employeeType);

      const balance = await this.getOrCreateLeaveBalance(
        connection,
        employeeId,
        employeeType,
        year,
        employee
      );
      
      return LeaveBalanceResponseDto.fromEntity(balance, employee);
    } catch (error) {
      this.handleServiceError(error, 'get leave balance');
    }
  }

  async getLeaveBalanceById(
    connection: Connection,
    id: string
  ): Promise<LeaveBalanceResponseDto> {
    try {
      this.validateObjectId(id, 'balance');
      await this.ensureInitialized(connection);
      const repository = connection.model('LeaveBalance', LeaveBalanceSchema);
      const balance = await repository.findById(id);
      
      if (!balance) {
        throw new NotFoundException('Leave balance not found');
      }
      
      // Get employee details
      const employee = await this.getEmployeeDetails(
        connection,
        balance.employeeId.toString(),
        balance.employeeType
      );
      
      return LeaveBalanceResponseDto.fromEntity(balance, employee);
    } catch (error) {
      this.handleServiceError(error, 'get leave balance by id');
    }
  }

  async updateLeaveBalance(
    connection: Connection,
    id: string,
    updateDto: UpdateLeaveBalanceDto
  ): Promise<LeaveBalanceResponseDto> {
    try {
      this.validateObjectId(id, 'balance');
      await this.ensureInitialized(connection);
      const repository = connection.model('LeaveBalance', LeaveBalanceSchema);
      const balance = await repository.findById(id);
      
      if (!balance) {
        throw new NotFoundException('Leave balance not found');
      }
      
      // Update balance
      await repository.findByIdAndUpdate(id, updateDto);
      
      // Get employee details
      const employee = await this.getEmployeeDetails(
        connection,
        balance.employeeId.toString(),
        balance.employeeType
      );
      
      // Get updated balance
      const updatedBalance = await repository.findById(id);
      return LeaveBalanceResponseDto.fromEntity(updatedBalance, employee);
    } catch (error) {
      this.handleServiceError(error, 'update leave balance');
    }
  }
}
