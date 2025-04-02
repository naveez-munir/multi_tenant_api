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
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AttendanceService } from "./attendance.service";
import { TenantGuard } from "../tenant/guards/tenant.guard";
import { CreateAttendanceDto } from "./dto/create-attendance-dto";
import { UpdateAttendanceDto } from "./dto/update-attendance-dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { BatchAttendanceDto, ClassAttendanceFilterDto, MonthlyReportFilterDto, UserAttendanceFilterDto } from "./dto/batch-attendance.dto";
import { AttendanceType } from "src/common/interfaces/attendanceType";

@Controller('attendance')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  async createAttendance(
    @Req() req: Request,
    @Body() createDto: CreateAttendanceDto
  ) {
    return this.attendanceService.createAttendance(req['tenantConnection'], createDto);
  }
  @Get()
async getAllAttendance(
  @Req() req: Request,
  @Query('userType') userType?: AttendanceType,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  const filters: any = {};
  
  if (userType) {
    filters.userType = userType;
  }

  if (startDate) {
    filters.startDate = new Date(startDate);
  }

  if (endDate) {
    filters.endDate = new Date(endDate);
  }

  return this.attendanceService.getAllAttendance(req['tenantConnection'], filters);
}

  @Get(':id')
  async getAttendanceById(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.attendanceService.getAttendanceById(req['tenantConnection'], id);
  }

  @Put(':id')
  async updateAttendance(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateAttendanceDto
  ) {
    return this.attendanceService.updateAttendance(req['tenantConnection'], id, updateDto);
  }

  @Delete(':id')
  async deleteAttendance(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.attendanceService.deleteAttendance(req['tenantConnection'], id);
  }

  // Advanced endpoints
  @Post('batch')
  async createBatchAttendance(
    @Req() req: Request,
    @Body() batchDto: BatchAttendanceDto
  ) {
    return this.attendanceService.createBatchAttendance(req['tenantConnection'], batchDto);
  }

  @Get('report/class/:classId')
  async getClassAttendanceReport(
    @Req() req: Request,
    @Param('classId') classId: string,
    @Query() filter: ClassAttendanceFilterDto
  ) {
    return this.attendanceService.getClassAttendanceReport(req['tenantConnection'], classId, filter);
  }

  @Get('report/user/:userId')
  async getUserAttendanceReport(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query() filter: UserAttendanceFilterDto
  ) {
    return this.attendanceService.getUserAttendanceReport(req['tenantConnection'], userId, filter);
  }

  @Get('report/monthly')
  async getMonthlyReport(
    @Req() req: Request,
    @Query() filter: MonthlyReportFilterDto
  ) {
    return this.attendanceService.getMonthlyReport(req['tenantConnection'], filter);
  }
}
