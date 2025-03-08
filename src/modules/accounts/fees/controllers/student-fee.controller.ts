import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  Req,
  Patch
} from '@nestjs/common';
import { Request } from 'express';
import { StudentFeeService } from '../services/student-fee.service';
import { GenerateStudentFeeDto } from '../dto/generate-student-fee.dto';
import { StudentFee } from '../../schemas/student-fee.schema';
import { ApplyDiscountDto, BulkGenerateStudentFeeDto } from '../dto/student-fee.dto';

@Controller('student-fees')
export class StudentFeeController {
  constructor(private readonly studentFeeService: StudentFeeService) {}

  @Post('generate')
  async generate(
    @Req() req: Request,
    @Body() generateDto: GenerateStudentFeeDto
  ): Promise<StudentFee> {
    return this.studentFeeService.generateStudentFee(
      req['tenantConnection'],
      generateDto
    );
  }

  @Post('bulk-generate')
  async bulkGenerate(
    @Req() req: Request,
    @Body() bulkGenerateDto: BulkGenerateStudentFeeDto
  ): Promise<StudentFee[]> {
    return this.studentFeeService.bulkGenerateStudentFees(
      req['tenantConnection'],
      bulkGenerateDto
    );
  }

  @Get('student/:studentId')
  async findAllForStudent(
    @Req() req: Request,
    @Param('studentId') studentId: string,
    @Query() query: { academicYear?: string; status?: string; billType?: string }
  ): Promise<StudentFee[]> {
    return this.studentFeeService.getStudentFees(
      req['tenantConnection'],
      studentId,
      query
    );
  }

  @Get('pending')
  async getPendingFees(
    @Req() req: Request,
    @Query() query: { academicYear?: string; classId?: string }
  ) {
    return this.studentFeeService.getPendingFees(
      req['tenantConnection'],
      query
    );
  }

  @Get('overdue')
  async getOverdueFees(
    @Req() req: Request,
    @Query() query: { academicYear?: string; classId?: string }
  ) {
    return this.studentFeeService.getOverdueFees(
      req['tenantConnection'],
      query
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<StudentFee> {
    return this.studentFeeService.getStudentFeeById(
      req['tenantConnection'],
      id
    );
  }

  @Patch(':id/discount')
  async applyDiscount(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() discountDto: ApplyDiscountDto
  ): Promise<StudentFee> {
    return this.studentFeeService.applyDiscount(
      req['tenantConnection'],
      id,
      discountDto
    );
  }

  @Patch(':id/cancel')
  async cancelFee(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('reason') reason: string
  ): Promise<StudentFee> {
    return this.studentFeeService.cancelStudentFee(
      req['tenantConnection'],
      id,
      reason
    );
  }

  @Post('calculate-late-fees')
  async calculateLateFees(
    @Req() req: Request
  ): Promise<{ updatedCount: number }> {
    const count = await this.studentFeeService.calculateLateFees(
      req['tenantConnection']
    );
    return { updatedCount: count };
  }

  @Post('update-statuses')
  async updateStatuses(
    @Req() req: Request
  ): Promise<{ updatedCount: number }> {
    const count = await this.studentFeeService.updateFeeStatuses(
      req['tenantConnection']
    );
    return { updatedCount: count };
  }

  @Post('generate-recurring')
  async generateRecurring(
    @Req() req: Request,
    @Body() options: {
      academicYear: string;
      month?: number; 
      quarter?: number;
      billType: string;
    }
  ): Promise<{ generated: number; skipped: number }> {
    return this.studentFeeService.generateRecurringFees(
      req['tenantConnection'],
      options
    );
  }

  @Post('student/:studentId/sync-discounts')
  async syncDiscounts(
    @Req() req: Request,
    @Param('studentId') studentId: string
  ): Promise<{ updated: number }> {
    return this.studentFeeService.synchronizeDiscountsForStudent(
      req['tenantConnection'],
      studentId
    );
  }
}
