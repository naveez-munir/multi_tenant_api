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
  NotFoundException,
  ParseBoolPipe
} from '@nestjs/common';
import { Request } from 'express';
import { ExamTypeService } from '../services/exam-type.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateExamTypeDto } from '../dto/create-exam-type.dto';
import { UpdateExamTypeDto } from '../dto/update-exam-type.dto';

@Controller('exam-types')
// @UseGuards(JwtAuthGuard)
export class ExamTypeController {
  constructor(private readonly examTypeService: ExamTypeService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateExamTypeDto
  ) {
    return this.examTypeService.createExamType(
      req['tenantConnection'],
      createDto
    );
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('activeOnly', new ParseBoolPipe({ optional: true })) activeOnly?: boolean
  ) {
    return this.examTypeService.getAllExamTypes(
      req['tenantConnection'],
      activeOnly
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.examTypeService.getExamTypeById(
      req['tenantConnection'],
      id
    );
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateExamTypeDto
  ) {
    return this.examTypeService.updateExamType(
      req['tenantConnection'],
      id,
      updateDto
    );
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    await this.examTypeService.deleteExamType(
      req['tenantConnection'],
      id
    );
    return { message: 'Exam type deleted successfully' };
  }

  @Put(':id/toggle-status')
  async toggleStatus(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.examTypeService.toggleExamTypeStatus(
      req['tenantConnection'],
      id
    );
  }
}
