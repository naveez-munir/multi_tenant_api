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
  HttpStatus
} from '@nestjs/common';
import { Request } from 'express';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto, DocumentDto, EducationHistoryDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ExperienceDto } from './dto/experience.dto';
import { TeacherListResponseDto } from './dto/teacher-list-response.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Teacher } from './schemas/teacher.schema';
import { SearchTeacherDto } from './dto/search-student.dto';

@Controller('teachers')
@UseGuards(TenantGuard, JwtAuthGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() createDto: CreateTeacherDto
  ): Promise<TeacherListResponseDto> {
    return this.teacherService.createTeacher(req['tenantConnection'], createDto);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() searchDto: SearchTeacherDto
  ) {
    return this.teacherService.searchTeachers(req['tenantConnection'], searchDto);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<Teacher> {
    const teacher = await this.teacherService.findById(req['tenantConnection'], id);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    return teacher;
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateTeacherDto
  ): Promise<TeacherListResponseDto> {
    return this.teacherService.updateTeacherById(req['tenantConnection'], id, updateDto);
  }

  @Put(':id/class')
  async assignToClass(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body('classId') classId: string
  ): Promise<TeacherListResponseDto> {
    return this.teacherService.assignTeacherToClass(
      req['tenantConnection'],
      teacherId,
      classId
    );
  }

  @Put(':id/education')
  async addEducation(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body() education: EducationHistoryDto
  ): Promise<TeacherListResponseDto> {
    return this.teacherService.addEducationHistory(
      req['tenantConnection'],
      teacherId,
      education
    );
  }

  @Put(':id/experience')
  async addExperience(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body() experience: ExperienceDto
  ): Promise<TeacherListResponseDto> {
    return this.teacherService.addExperience(
      req['tenantConnection'],
      teacherId,
      experience
    );
  }

  @Put(':id/documents')
  async uploadDocument(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body() document: DocumentDto
  ): Promise<TeacherListResponseDto> {
    return this.teacherService.addDocument(
      req['tenantConnection'],
      teacherId,
      document
    );
  }

  @Put(':id/status')
  async updateStatus(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string,
    @Body('employmentStatus') employmentStatus: string
  ): Promise<TeacherListResponseDto> {
    return this.teacherService.updateTeacherStatus(
      req['tenantConnection'],
      teacherId,
      employmentStatus
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') teacherId: string
  ): Promise<void> {
    const result = await this.teacherService.deleteTeacher(
      req['tenantConnection'],
      teacherId
    );
    if (!result) {
      throw new NotFoundException('Teacher not found');
    }
  }
}
