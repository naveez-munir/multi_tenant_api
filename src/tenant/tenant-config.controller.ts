import { Controller, Get, Put, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantConfigService } from './tenant-config.service';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { IsSuperAdmin } from '../common/decorators/is-super-admin.decorator';
import { Tenant } from './schemas/tenant.schema';

@Controller('tenant-config')
@UseGuards(JwtAuthGuard)
export class TenantConfigController {
  constructor(private tenantConfigService: TenantConfigService) {}

  @Get('all')
  async getAllConfigs() {
    return this.tenantConfigService.getAllConfigs();
  }

  @Put()
  async updateConfig(
    @CurrentTenant() tenant: Tenant,
    @Body() configUpdate: any,
    @Request() req: any,
  ) {
    const { role, tenantId } = req.user;

    if (role === 'SUPER_ADMIN') {
      if (!configUpdate.tenantId) {
        throw new BadRequestException('tenantId is required for updates by super admin');
      }
      return this.tenantConfigService.updateConfig(
        configUpdate.tenantId,
        configUpdate,
      );
    }

    return this.tenantConfigService.updateConfig(tenantId, configUpdate);
  }
}

