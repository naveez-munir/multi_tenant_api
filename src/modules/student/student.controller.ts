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
  BadRequestException,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { Request } from 'express';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SearchStudentDto } from './dto/search-student.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('students')
@UseGuards(TenantGuard, JwtAuthGuard) // Combined guard declarations
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() createDto: CreateStudentDto
  ) {
    return this.studentService.createStudent(
      req['tenantConnection'],
      createDto
    );
  }

  @Get()
  async getAllStudents(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() searchDto: SearchStudentDto
  ) {
    return this.studentService.searchStudents(
      req['tenantConnection'],
      searchDto
    );
  }

  // Remove the duplicate endpoint by merging with the above

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const student = await this.studentService.findById(
      req['tenantConnection'],
      id
    );
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentDto
  ) {
    const updated = await this.studentService.updateStudentById(
      req['tenantConnection'],
      id,
      updateDto
    );
    if (!updated) {
      throw new NotFoundException('Student not found');
    }
    return updated;
  }

  @Post(':id/documents')
  async addDocument(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() document: { documentType: string; documentUrl: string }
  ) {
    if (!document.documentType || !document.documentUrl) {
      throw new BadRequestException('Document type and URL are required');
    }
    
    const updated = await this.studentService.addDocument(
      req['tenantConnection'],
      id,
      document
    );
    if (!updated) {
      throw new NotFoundException('Student not found');
    }
    return updated;
  }

  @Put(':id/attendance')
  async updateAttendance(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body('percentage') percentage: number
  ) {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }
    
    const updated = await this.studentService.updateAttendance(
      req['tenantConnection'],
      id,
      percentage
    );
    if (!updated) {
      throw new NotFoundException('Student not found');
    }
    return updated;
  }

  @Get('class/:gradeLevel')
  async getByClass(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('gradeLevel') gradeLevel: string,
    @Query('sectionId') sectionId?: string
  ) {
    return this.studentService.getStudentsByClass(
      req['tenantConnection'],
      gradeLevel,
      sectionId
    );
  }

  @Get('guardian/:cnic')
  async getByGuardianCnic(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('cnic') guardianCnic: string
  ) {
    if (!guardianCnic.match(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)) {
      throw new BadRequestException('CNIC must be in format: 00000-0000000-0');
    }
    
    return this.studentService.getStudentsByGuardianCnic(
      req['tenantConnection'],
      guardianCnic
    );
  }

  @Put(':id/status')
  async updateStatus(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() statusData: {
      status: string;
      exitStatus?: string;
      exitDate?: Date;
      exitRemarks?: string;
    }
  ) {
    // Validate status transitions
    if (['Graduated', 'Expelled', 'Withdrawn'].includes(statusData.status) && 
        (!statusData.exitStatus || !statusData.exitDate)) {
      throw new BadRequestException(
        'Exit status and exit date are required when status is Graduated, Expelled, or Withdrawn'
      );
    }
    
    const updated = await this.studentService.updateStudentStatus(
      req['tenantConnection'],
      id,
      statusData.status,
      statusData.exitStatus ? {
        exitStatus: statusData.exitStatus,
        exitDate: statusData.exitDate,
        exitRemarks: statusData.exitRemarks
      } : undefined
    );
    if (!updated) {
      throw new NotFoundException('Student not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const deleted = await this.studentService.delete(
      req['tenantConnection'],
      id
    );
    if (!deleted) {
      throw new NotFoundException('Student not found');
    }
    return { message: 'Student deleted successfully' };
  }
}
