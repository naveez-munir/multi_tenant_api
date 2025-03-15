import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  NotFoundException,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentTenant } from 'src/common/decorators/tenant.decorator';
import { TenantGuard } from 'src/modules/tenant/guards/tenant.guard';
import { Tenant } from 'src/modules/tenant/schemas/tenant.schema';
import { ApproveLeaveDto, CreateLeaveBalanceDto, CreateLeaveDto, LeaveBalanceResponseDto, LeaveResponseDto, SearchLeaveDto, UpdateLeaveBalanceDto, UpdateLeaveDto } from '../dto/leave.dto';
import { LeaveService } from '../services/leave.service';

@Controller('leaves')
@UseGuards(TenantGuard, JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLeaveRequest(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() createDto: CreateLeaveDto
  ): Promise<LeaveResponseDto> {
    return this.leaveService.createLeaveRequest(req['tenantConnection'], createDto);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() searchDto: SearchLeaveDto
  ) {
    return this.leaveService.searchLeaves(req['tenantConnection'], searchDto);
  }

  @Get('employee/:employeeId')
  async findByEmployee(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('employeeId') employeeId: string,
    @Query('employeeType') employeeType: string
  ) {
    if (!employeeType) {
      throw new BadRequestException('Employee type is required');
    }
    return this.leaveService.findAllByEmployee(
      req['tenantConnection'], 
      employeeId, 
      employeeType
    );
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<LeaveResponseDto> {
    const leave = await this.leaveService.findLeaveById(req['tenantConnection'], id);
    if (!leave) {
      throw new NotFoundException('Leave record not found');
    }
    return leave;
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateLeaveDto
  ): Promise<LeaveResponseDto> {
    return this.leaveService.updateLeave(req['tenantConnection'], id, updateDto);
  }

  @Put(':id/approve')
  async approveLeave(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() approveDto: ApproveLeaveDto
  ): Promise<LeaveResponseDto> {
    return this.leaveService.approveLeave(
      req['tenantConnection'],
      id,
      approveDto
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<void> {
    const result = await this.leaveService.cancelLeave(
      req['tenantConnection'],
      id
    );
    if (!result) {
      throw new NotFoundException('Leave record not found');
    }
  }

  // Leave Balance Endpoints
  @Post('balance')
  @HttpCode(HttpStatus.CREATED)
  async createLeaveBalance(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() createDto: CreateLeaveBalanceDto
  ): Promise<LeaveBalanceResponseDto> {
    return this.leaveService.createLeaveBalance(req['tenantConnection'], createDto);
  }

  @Get('balance/employee/:employeeId')
  async getLeaveBalance(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('employeeId') employeeId: string,
    @Query('employeeType') employeeType: string,
    @Query('year') year: string
  ): Promise<LeaveBalanceResponseDto> {
    if (!employeeType) {
      throw new BadRequestException('Employee type is required');
    }
    
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    return this.leaveService.getLeaveBalance(
      req['tenantConnection'],
      employeeId,
      employeeType,
      currentYear
    );
  }

  @Get('balance/:id')
  async getLeaveBalanceById(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<LeaveBalanceResponseDto> {
    const balance = await this.leaveService.getLeaveBalanceById(req['tenantConnection'], id);
    if (!balance) {
      throw new NotFoundException('Leave balance record not found');
    }
    return balance;
  }

  @Put('balance/:id')
  async updateLeaveBalance(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateLeaveBalanceDto
  ): Promise<LeaveBalanceResponseDto> {
    return this.leaveService.updateLeaveBalance(
      req['tenantConnection'],
      id,
      updateDto
    );
  }
}
