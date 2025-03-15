import { IsNotEmpty, IsString, IsDate, IsEnum, IsOptional, IsMongoId, MinDate, MaxDate, IsBoolean, IsDateString, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateLeaveDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  @IsEnum(['Teacher', 'Staff'])
  employeeType: string;

  @IsNotEmpty()
  @IsEnum(['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER'])
  leaveType: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(new Date().getFullYear(), 0, 1))
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateLeaveDto extends PartialType(CreateLeaveDto) {
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsEnum(['Teacher', 'Staff'])
  approverType?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  approvalDate?: Date;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeductionApplied?: boolean;
}

export class ApproveLeaveDto {
  @IsNotEmpty()
  @IsMongoId()
  approvedBy: string;

  @IsNotEmpty()
  @IsEnum(['Teacher', 'Staff'])
  approverType: string;

  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'])
  status: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

// leave-response.dto.ts
export class LeaveResponseDto {
  id: string;
  employeeId: string;
  employeeType: string;
  employeeName?: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  reason?: string;
  status: string;
  isPaid: boolean;
  approvedBy?: string;
  approverName?: string;
  approvalDate?: Date;
  comments?: string;
  isDeductionApplied: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(leave: any, employee?: any, approver?: any): LeaveResponseDto {
    const response = new LeaveResponseDto();
    response.id = leave._id.toString();
    response.employeeId = leave.employeeId.toString();
    response.employeeType = leave.employeeType;
    response.leaveType = leave.leaveType;
    response.startDate = leave.startDate;
    response.endDate = leave.endDate;
    response.numberOfDays = leave.numberOfDays;
    response.reason = leave.reason;
    response.status = leave.status;
    response.isPaid = leave.isPaid;
    response.isDeductionApplied = leave.isDeductionApplied;
    response.createdAt = leave.createdAt;
    response.updatedAt = leave.updatedAt;
    
    if (leave.approvedBy) {
      response.approvedBy = leave.approvedBy.toString();
      response.approvalDate = leave.approvalDate;
      response.comments = leave.comments;
    }

    if (employee) {
      response.employeeName = `${employee.firstName} ${employee.lastName}`;
    }

    if (approver) {
      response.approverName = `${approver.firstName} ${approver.lastName}`;
    }

    return response;
  }
}


export class CreateLeaveBalanceDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  @IsEnum(['Teacher', 'Staff'])
  employeeType: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  year: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  sickLeaveAllocation: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  casualLeaveAllocation: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  earnedLeaveAllocation: number;
}


export class UpdateLeaveBalanceDto extends PartialType(CreateLeaveBalanceDto) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  sickLeaveUsed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  casualLeaveUsed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnedLeaveUsed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unpaidLeaveUsed?: number;
}

export class LeaveBalanceResponseDto {
  id: string;
  employeeId: string;
  employeeType: string;
  employeeName?: string;
  year: number;
  
  sickLeaveAllocation: number;
  sickLeaveUsed: number;
  sickLeaveRemaining: number;
  
  casualLeaveAllocation: number;
  casualLeaveUsed: number;
  casualLeaveRemaining: number;
  
  earnedLeaveAllocation: number;
  earnedLeaveUsed: number;
  earnedLeaveRemaining: number;
  
  unpaidLeaveUsed: number;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(balance: any, employee?: any): LeaveBalanceResponseDto {
    const response = new LeaveBalanceResponseDto();
    response.id = balance._id.toString();
    response.employeeId = balance.employeeId.toString();
    response.employeeType = balance.employeeType;
    response.year = balance.year;
    
    response.sickLeaveAllocation = balance.sickLeaveAllocation;
    response.sickLeaveUsed = balance.sickLeaveUsed;
    response.sickLeaveRemaining = balance.sickLeaveAllocation - balance.sickLeaveUsed;
    
    response.casualLeaveAllocation = balance.casualLeaveAllocation;
    response.casualLeaveUsed = balance.casualLeaveUsed;
    response.casualLeaveRemaining = balance.casualLeaveAllocation - balance.casualLeaveUsed;
    
    response.earnedLeaveAllocation = balance.earnedLeaveAllocation;
    response.earnedLeaveUsed = balance.earnedLeaveUsed;
    response.earnedLeaveRemaining = balance.earnedLeaveAllocation - balance.earnedLeaveUsed;
    
    response.unpaidLeaveUsed = balance.unpaidLeaveUsed;
    
    response.isActive = balance.isActive;
    response.createdAt = balance.createdAt;
    response.updatedAt = balance.updatedAt;

    if (employee) {
      response.employeeName = `${employee.firstName} ${employee.lastName}`;
    }

    return response;
  }
}


export class SearchLeaveDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsEnum(['Teacher', 'Staff'])
  employeeType?: string;

  @IsOptional()
  @IsEnum(['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER'])
  leaveType?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsEnum(['true', 'false'])
  isPaid?: string;
}
