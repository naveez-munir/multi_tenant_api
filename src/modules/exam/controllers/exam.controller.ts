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
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { ExamService } from '../services/exam.service';
import { CreateExamDto } from '../dto/exam/create-exam.dto';
import { UpdateExamDto } from '../dto/exam/update-exam.dto';
import { ExamQueryDto } from '../dto/exam/exam-query.dto';

@Controller('exams')
// @UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateExamDto
  ) {
    return this.examService.createExam(
      req['tenantConnection'],
      createDto
    );
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: ExamQueryDto
  ) {
    return this.examService.findExams(
      req['tenantConnection'],
      query
    );
  }

  @Get('upcoming')
  async getUpcoming(
    @Req() req: Request,
    @Query('classId') classId?: string
  ) {
    return this.examService.getUpcomingExams(
      req['tenantConnection'],
      classId
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.examService.findExamById(
      req['tenantConnection'],
      id
    );
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateExamDto
  ) {
    return this.examService.updateExam(
      req['tenantConnection'],
      id,
      updateDto
    );
  }

  @Put(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.examService.updateExamStatus(
      req['tenantConnection'],
      id,
      status
    );
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    await this.examService.deleteExam(
      req['tenantConnection'],
      id
    );
    return { message: 'Exam deleted successfully' };
  }
}
