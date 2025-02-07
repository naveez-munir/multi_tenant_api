import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantService } from './tenant.service';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { DatabaseModule } from '../../database/database.module';
import { ConnectionManager } from './connection-manager';
import { TenantConfig, TenantConfigSchema } from './schemas/tenant-config.schema';
import { TenantConfigService } from './tenant-config.service';
import { TenantConfigController } from './tenant-config.controller';
import { User, UserSchema } from 'src/modules/users/schemas/user.schema';
import { InitializationService } from 'src/initialization/init.service';
import { TenantController } from './tenant.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TenantConfig.name, schema: TenantConfigSchema },
    ]),
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
    ]),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    DatabaseModule,
    UsersModule,
    StudentModule
  ],
  providers: [TenantService,ConnectionManager,TenantConfigService,InitializationService],
  controllers: [TenantController,TenantConfigController],
  exports: [TenantService,TenantConfigService],
})
export class TenantModule {}
