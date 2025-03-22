import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException
} from '@nestjs/common';
import { Request } from 'express';
import { ClassService } from './class.service';
import { CreateClassDto, TeacherType } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('classes')
@UseGuards(TenantGuard)
@UseGuards(JwtAuthGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateClassDto
  ) {
    return this.classService.createClass(req['tenantConnection'], createDto);
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query() filter
  ) {
    return this.classService.findClasses(req['tenantConnection'], filter);
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const classEntity = await this.classService.findById(req['tenantConnection'], id);
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }
    return classEntity;
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateClassDto
  ) {
    const updated = await this.classService.updateClass(req['tenantConnection'], id, updateDto);
    if (!updated) {
      throw new NotFoundException('Class not found');
    }
    return updated;
  }

  @Put(':id/teacher')
  async assignTeacher(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('teacherId') teacherId: string
  ) {
    const updated = await this.classService.handleTeacherAssignment(
      req['tenantConnection'],
      id,
      TeacherType.MAIN,
      teacherId,

    );
    if (!updated) {
      throw new NotFoundException('Class not found');
    }
    return updated;
  }

  @Put(':id/teacher/remove')
  async removeTeacherAssignment(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.classService.handleTeacherAssignment(
      req['tenantConnection'],
      id,
      TeacherType.MAIN
    );
  }

  @Put(':id/temp-teacher/assign')
  async assignTempTeacher(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('teacherId') teacherId: string
  ) {
    return this.classService.handleTeacherAssignment(
      req['tenantConnection'],
      id,
      TeacherType.TEMPORARY,
      teacherId,
    );
  }

  @Put(':id/temp-teacher/remove')
  async removeTempTeacher(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.classService.handleTeacherAssignment(
      req['tenantConnection'],
      id,
      TeacherType.TEMPORARY,
    );
  }

  @Put(':id/subjects/add')
  async addSubjects(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('subjectIds') subjectIds: string[]
  ) {
    const updated = await this.classService.addSubjects(
      req['tenantConnection'],
      id,
      subjectIds
    );
    if (!updated) {
      throw new NotFoundException('Class not found');
    }
    return updated;
  }

  @Put(':id/subjects/remove')
  async removeSubjects(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('subjectIds') subjectIds: string[]
  ) {
    const updated = await this.classService.removeSubjects(
      req['tenantConnection'],
      id,
      subjectIds
    );
    if (!updated) {
      throw new NotFoundException('Class not found');
    }
    return updated;
  }

  @Get('grade/:gradeLevel')
  async getByGradeLevel(
    @Req() req: Request,
    @Param('gradeLevel') gradeLevel: string,
    @Query('sectionId') sectionId?: string
  ) {
    return this.classService.getClassesByGradeLevel(
      req['tenantConnection'],
      gradeLevel,
      sectionId
    );
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const deleted = await this.classService.deleteClass(req['tenantConnection'], id);
    if (!deleted) {
      throw new NotFoundException('Class not found');
    }
    return { message: 'Class deleted successfully' };
  }
}
