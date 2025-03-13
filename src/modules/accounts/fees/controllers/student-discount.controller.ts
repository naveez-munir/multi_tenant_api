import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { StudentDiscount } from '../../schemas/student-discount.schema';
import { StudentDiscountService } from '../services/student-discount.service';
import {
  CreateStudentDiscountDto,
  UpdateStudentDiscountDto,
} from '../dto/student-discount.dto';

@Controller('student-discounts')
export class StudentDiscountController {
  constructor(
    private readonly studentDiscountService: StudentDiscountService,
  ) {}

  @Post()
  async createDiscount(
    @Req() req: Request,
    @Body() createDto: CreateStudentDiscountDto,
    @Query('syncWithFees') syncWithFees?: string,
  ): Promise<StudentDiscount> {
    return this.studentDiscountService.createDiscount(
      req['tenantConnection'],
      createDto,
      syncWithFees === 'true',
    );
  }

  @Get('student/:studentId')
  async findByStudent(
    @Req() req: Request,
    @Param('studentId') studentId: string,
  ): Promise<StudentDiscount[]> {
    return this.studentDiscountService.findByStudent(
      req['tenantConnection'],
      studentId,
    );
  }

  @Get('active/:studentId')
  async getActiveDiscounts(
    @Req() req: Request,
    @Param('studentId') studentId: string,
  ): Promise<StudentDiscount[]> {
    return this.studentDiscountService.getActiveDiscounts(
      req['tenantConnection'],
      studentId,
    );
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentDiscountDto,
    @Query('syncWithFees') syncWithFees?: string,
  ): Promise<StudentDiscount> {
    return this.studentDiscountService.update(
      req['tenantConnection'],
      id,
      updateDto,
      syncWithFees === 'true',
    );
  }

  @Put(':id/toggle-status')
  async toggleStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('syncWithFees') syncWithFees?: string,
  ): Promise<StudentDiscount> {
    return this.studentDiscountService.toggleDiscountStatus(
      req['tenantConnection'],
      id,
      syncWithFees === 'true',
    );
  }

  @Post(':id/sync-fees')
  async syncFees(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ updated: number }> {
    return this.studentDiscountService.synchronizeFeesForDiscount(
      req['tenantConnection'],
      id,
    );
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('syncWithFees') syncWithFees?: string,
  ): Promise<boolean> {
    return this.studentDiscountService.remove(
      req['tenantConnection'],
      id,
      syncWithFees === 'true',
    );
  }

  @Post('student/:studentId/sync-discounts')
  async syncStudentDiscounts(
    @Req() req: Request,
    @Param('studentId') studentId: string,
  ): Promise<{ updated: number }> {
    if (!studentId) {
      throw new BadRequestException('Student ID is required');
    }

    // Use an existing method or add a new public method to StudentDiscountService
    return this.studentDiscountService.synchronizeDiscountsForStudent(
      req['tenantConnection'],
      studentId,
    );
  }
}
