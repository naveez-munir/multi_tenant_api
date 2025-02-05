import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Tenant } from './schemas/tenant.schema';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async createTenant(@Body() tenantData: Partial<Tenant>) {
    return this.tenantService.createTenant(tenantData);
  }

  @Get(':id')
  async getTenantById(@Param('id') id: string) {
    return this.tenantService.getTenantById(id);
  }

  @Get()
  async getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Put(':id')
  async updateTenant(
    @Param('id') id: string,
    @Body() updateData: Partial<Tenant>,
  ) {
    return this.tenantService.updateTenant(id, updateData);
  }

  @Delete(':id')
  async deleteTenant(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }
}
