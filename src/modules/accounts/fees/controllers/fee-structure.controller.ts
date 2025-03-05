import { Controller, Get, Post, Body, Param, Put, Delete, Req, Query, Patch } from '@nestjs/common';
import { Request } from 'express';
import { FeeStructureService } from '../services/fee-structure.service';
import { BulkGenerateFeeStructureDto, CloneFeeStructureDto, CreateFeeStructureDto, ListFeeStructureDto, UpdateFeeStructureDto } from '../dto/create-fee-structure.dto';
import { FeeStructure } from '../../schemas/fee-structure.schema';

@Controller('fee-structures')
export class FeeStructureController {
  constructor(private readonly feeStructureService: FeeStructureService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateFeeStructureDto
  ): Promise<FeeStructure> {
    return this.feeStructureService.createFeeStructure(
      req['tenantConnection'],
      createDto
    );
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: ListFeeStructureDto
  ): Promise<FeeStructure[]> {
    return this.feeStructureService.getFeeStructures(
      req['tenantConnection'],
      query
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<FeeStructure> {
    return this.feeStructureService.getFeeStructureById(
      req['tenantConnection'],
      id
    );
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateFeeStructureDto
  ): Promise<FeeStructure> {
    return this.feeStructureService.updateFeeStructure(
      req['tenantConnection'],
      id,
      updateDto
    );
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<boolean> {
    return this.feeStructureService.deleteFeeStructure(
      req['tenantConnection'],
      id
    );
  }

  @Post('bulk-generate')
  async bulkGenerate(
    @Req() req: Request,
    @Body() bulkGenerateDto: BulkGenerateFeeStructureDto
  ): Promise<FeeStructure[]> {
    return this.feeStructureService.bulkGenerateFeeStructures(
      req['tenantConnection'],
      bulkGenerateDto
    );
  }

  @Get('class/:classId/academic-year/:year')
  async findByClassAndYear(
    @Req() req: Request,
    @Param('classId') classId: string,
    @Param('year') year: string
  ): Promise<FeeStructure> {
    return this.feeStructureService.getFeeStructureByClassAndYear(
      req['tenantConnection'],
      classId,
      year
    );
  }

  @Post(':id/clone')
  async cloneStructure(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() cloneDto: CloneFeeStructureDto
  ): Promise<FeeStructure> {
    return this.feeStructureService.cloneFeeStructure(
      req['tenantConnection'],
      id,
      cloneDto
    );
  }

  @Patch(':id/toggle-status')
  async toggleStatus(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<FeeStructure> {
    return this.feeStructureService.toggleFeeStructureStatus(
      req['tenantConnection'],
      id
    );
  }
}
