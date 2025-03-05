import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Query, 
  Patch,
  UseGuards,
  HttpStatus,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { FeeCategoryService } from '../services/fee-category.service';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto, ListFeeCategoryDto } from '../dto/create-fee-category.dto';
import { FeeCategory } from '../../schemas/fee-category.schema';

@Controller('fee-categories')
export class FeeCategoryController {
  constructor(private readonly feeCategoryService: FeeCategoryService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateFeeCategoryDto
  ): Promise<FeeCategory> {
    return this.feeCategoryService.createFeeCategory(
      req['tenantConnection'],
      createDto
    );
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: ListFeeCategoryDto
  ): Promise<FeeCategory[]> {
    return this.feeCategoryService.getFeeCategories(
      req['tenantConnection'],
      query
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<FeeCategory> {
    return this.feeCategoryService.getFeeCategoryById(
      req['tenantConnection'],
      id
    );
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateFeeCategoryDto
  ): Promise<FeeCategory> {
    return this.feeCategoryService.updateFeeCategory(
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
    return this.feeCategoryService.deleteFeeCategory(
      req['tenantConnection'],
      id
    );
  }

  @Patch(':id/toggle-status')
  async toggleStatus(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<FeeCategory> {
    return this.feeCategoryService.toggleFeeCategoryStatus(
      req['tenantConnection'],
      id
    );
  }

  @Get(':id/usage')
  async getCategoryUsage(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('academicYear') academicYear?: string
  ) {
    return this.feeCategoryService.getCategoryUsageStats(
      req['tenantConnection'],
      id,
      academicYear
    );
  }

  @Get('validate/bulk')
  async validateCategories(
    @Req() req: Request,
    @Query('ids') ids: string
  ) {
    const categoryIds = ids.split(',');
    return this.feeCategoryService.validateCategories(
      req['tenantConnection'],
      categoryIds
    );
  }
}
