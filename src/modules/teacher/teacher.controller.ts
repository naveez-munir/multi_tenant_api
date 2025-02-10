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
  UseGuards
} from '@nestjs/common';
import { Request } from 'express';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { SearchTeacherDto } from './dto/search-student.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('teachers')
@UseGuards(TenantGuard)
@UseGuards(JwtAuthGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ✅ Create a new teacher
  @Post()
  async create(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() createDto: CreateTeacherDto
  ) {
    return this.teacherService.createTeacher(req['tenantConnection'], createDto);
  }

  // ✅ Get all teachers (with optional filtering)
  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() searchDto: SearchTeacherDto
  ) {
    return this.teacherService.searchTeachers(req['tenantConnection'], searchDto);
  }

  // ✅ Get a teacher by ID
  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const teacher = await this.teacherService.findById(req['tenantConnection'], id);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    return teacher;
  }

  // ✅ Update teacher by ID
  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateTeacherDto
  ) {
    return this.teacherService.updateTeacherById(req['tenantConnection'], id, updateDto);
  }

  // ✅ Assign a teacher to a class
  @Put(':id/class')
  async assignToClass(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body('classId') classId: string
  ) {
    return this.teacherService.assignTeacherToClass(req['tenantConnection'], teacherId, classId);
  }

  // ✅ Add education history
  @Put(':id/education')
  async addEducation(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body() education: { degree: string; institution: string; year: number; certificateUrl?: string }
  ) {
    return this.teacherService.addEducationHistory(req['tenantConnection'], teacherId, education);
  }

  // ✅ Add experience
  @Put(':id/experience')
  async addExperience(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body() experience: { institution: string; position: string; fromDate: Date; toDate?: Date; description?: string; experienceLatterUrl?: string }
  ) {
    return this.teacherService.addExperience(req['tenantConnection'], teacherId, experience);
  }

  // ✅ Upload teacher documents
  @Put(':id/documents')
  async uploadDocument(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body() document: { documentType: string; documentUrl: string }
  ) {
    return this.teacherService.addDocument(req['tenantConnection'], teacherId, document);
  }

  // ✅ Update teacher employment status
  @Put(':id/status')
  async updateStatus(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body('employmentStatus') employmentStatus: string
  ) {
    return this.teacherService.updateTeacherStatus(req['tenantConnection'], teacherId, employmentStatus);
  }

  // ✅ Delete teacher
  @Delete(':id')
  async delete(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string
  ) {
    return this.teacherService.deleteTeacher(req['tenantConnection'], teacherId);
  }
}
