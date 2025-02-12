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
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('subjects')
@UseGuards(TenantGuard)
@UseGuards(JwtAuthGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateSubjectDto
  ) {
    return this.subjectService.createSubject(
      req['tenantConnection'],
      createDto
    );
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('subjectName') subjectName?: string,
    @Query('subjectCode') subjectCode?: string
  ) {
    const filter = {};
    if (subjectName) filter['subjectName'] = { $regex: subjectName, $options: 'i' };
    if (subjectCode) filter['subjectCode'] = subjectCode;

    return this.subjectService.findSubjects(
      req['tenantConnection'],
      filter
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const subject = await this.subjectService.findById(
      req['tenantConnection'],
      id
    );
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateSubjectDto
  ) {
    const subject = await this.subjectService.updateSubject(
      req['tenantConnection'],
      id,
      updateDto
    );
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const deleted = await this.subjectService.deleteSubject(
      req['tenantConnection'],
      id
    );
    if (!deleted) {
      throw new NotFoundException('Subject not found');
    }
    return { message: 'Subject deleted successfully' };
  }
}
