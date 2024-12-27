import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantConfigService } from './tenant-config.service';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { Tenant } from './schemas/tenant.schema';

@Controller('tenant-config')
@UseGuards(JwtAuthGuard)
export class TenantConfigController {
  constructor(private tenantConfigService: TenantConfigService) {}

  @Get()
  async getConfig(@CurrentTenant() tenant: Tenant) {
    return this.tenantConfigService.getConfig(tenant._id.toString());
  }

  @Put()
  async updateConfig(
    @CurrentTenant() tenant: Tenant,
    @Body() configUpdate: any,
  ) {
    return this.tenantConfigService.updateConfig(
      tenant._id.toString(),
      configUpdate,
    );
  }
}
