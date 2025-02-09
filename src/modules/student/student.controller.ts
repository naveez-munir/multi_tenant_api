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
  BadRequestException
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
@UseGuards(TenantGuard)
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
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

  @Get('')
  async GetAllStudents(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() searchDto: SearchStudentDto
  ) {
    return this.studentService.searchStudents(
      req['tenantConnection'],
      searchDto
    );
  }
  @Get('search')
  async search(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() searchDto: SearchStudentDto
  ) {
    return this.studentService.searchStudents(
      req['tenantConnection'],
      searchDto
    );
  }

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
