import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ExamResultService } from '../services/exam-result.service';
import { ExamResultQueryDto } from '../dto/result/exam-result-query.dto';
import { CreateExamResultDto } from '../dto/result/create-result.dto';

@Controller('exam-results')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class ExamResultController {
  constructor(private readonly resultService: ExamResultService) {}

  @Post()
  // @Roles('TEACHER', 'ADMIN')
  async create(
    @Req() req: Request,
    @Body() createDto: CreateExamResultDto
  ) {
    return this.resultService.createResult(
      req['tenantConnection'],
      createDto
    );
  }

  @Get()
  // @Roles('TEACHER', 'ADMIN')
  async findAll(
    @Req() req: Request,
    @Query() query: ExamResultQueryDto
  ) {
    return this.resultService.findResults(
      req['tenantConnection'],
      query
    );
  }

  @Get('student/:studentId')
  // @Roles('STUDENT', 'TEACHER', 'ADMIN')
  async getStudentResults(
    @Req() req: Request,
    @Param('studentId') studentId: string
  ) {
    return this.resultService.findStudentResults(
      req['tenantConnection'],
      studentId
    );
  }

  @Get('exam/:examId')
  // @Roles('TEACHER', 'ADMIN')
  async getExamResults(
    @Req() req: Request,
    @Param('examId') examId: string
  ) {
    return this.resultService.findResults(
      req['tenantConnection'],
      { examId }
    );
  }

  @Get(':id')
  // @Roles('STUDENT', 'TEACHER', 'ADMIN')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.resultService.findResultById(
      req['tenantConnection'],
      id
    );
  }

  @Post('generate-ranks/:examId')
  // @Roles('TEACHER', 'ADMIN')
  async generateRanks(
    @Req() req: Request,
    @Param('examId') examId: string
  ) {
    return this.resultService.generateClassRanks(
      req['tenantConnection'],
      examId
    );
  }
}
