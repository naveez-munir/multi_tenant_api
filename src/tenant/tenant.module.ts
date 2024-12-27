import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantService } from './tenant.service';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { DatabaseModule } from '../database/database.module';
import { ConnectionManager } from './connection-manager';
import { TenantConfig, TenantConfigSchema } from './schemas/tenant-config.schema';
import { TenantConfigService } from './tenant-config.service';
import { TenantConfigController } from './tenant-config.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TenantConfig.name, schema: TenantConfigSchema },
    ]),
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
    ]),
    DatabaseModule,
  ],
  providers: [TenantService,ConnectionManager,TenantConfigService],
  controllers: [TenantConfigController],
  exports: [TenantService,TenantConfigService],
})
export class TenantModule {}
