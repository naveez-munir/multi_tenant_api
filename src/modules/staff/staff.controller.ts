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
import { CreateStaffDto, UpdateStaffDto, UpdateStatusDto } from './dto/create-staff.dto';
import { StaffDetailResponseDto, StaffListResponseDto } from './dto/staff-list-response.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SearchStaffDto } from './dto/search-staff.dto';
import { DocumentDto, EducationHistoryDto, ExperienceDto } from 'src/common/dto';
import { EmergencyContactDto } from './dto/create-staff.dto';
import { StaffService } from './staff.service';

@Controller('staff')
@UseGuards(TenantGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() createDto: CreateStaffDto
  ): Promise<StaffListResponseDto> {
    return this.staffService.createStaff(req['tenantConnection'], createDto);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() searchDto: SearchStaffDto
  ): Promise<StaffListResponseDto[]> {
    return this.staffService.searchStaff(req['tenantConnection'], searchDto);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<StaffDetailResponseDto> {
    return this.staffService.getStaffDetail(req['tenantConnection'], id);
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateStaffDto
  ): Promise<StaffListResponseDto> {
    return this.staffService.updateStaffById(req['tenantConnection'], id, updateDto);
  }

  @Put(':id/education')
  async addEducation(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') staffId: string,
    @Body() education: EducationHistoryDto
  ): Promise<StaffListResponseDto> {
    return this.staffService.addEducationHistory(
      req['tenantConnection'],
      staffId,
      education
    );
  }

  @Put(':id/experience')
  async addExperience(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') staffId: string,
    @Body() experience: ExperienceDto
  ): Promise<StaffListResponseDto> {
    return this.staffService.addExperience(
      req['tenantConnection'],
      staffId,
      experience
    );
  }

  @Put(':id/documents')
  async uploadDocument(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') staffId: string,
    @Body() document: DocumentDto
  ): Promise<StaffListResponseDto> {
    return this.staffService.addDocument(
      req['tenantConnection'],
      staffId,
      document
    );
  }

  @Put(':id/emergency-contact')
  async updateEmergencyContact(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') staffId: string,
    @Body() emergencyContact: EmergencyContactDto
  ): Promise<StaffListResponseDto> {
    return this.staffService.updateEmergencyContact(
      req['tenantConnection'],
      staffId,
      emergencyContact
    );
  }

  @Put(':id/status')
  async updateStatus(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') staffId: string,
    @Body() statusDto: UpdateStatusDto
  ): Promise<StaffListResponseDto> {
    return this.staffService.updateStaffStatus(
      req['tenantConnection'],
      staffId,
      statusDto.status
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') staffId: string
  ): Promise<void> {
    const result = await this.staffService.deleteStaff(
      req['tenantConnection'],
      staffId
    );
    if (!result) {
      throw new NotFoundException('Staff member not found');
    }
  }
}
