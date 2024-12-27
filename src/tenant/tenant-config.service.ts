import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantConfig } from './schemas/tenant-config.schema';

@Injectable()
export class TenantConfigService {
  constructor(
    @InjectModel(TenantConfig.name)
    private tenantConfigModel: Model<TenantConfig>,
  ) {}

  async getConfig(tenantId: string): Promise<TenantConfig> {
    const config = await this.tenantConfigModel.findOne({ tenantId }).exec();
    if (!config) {
      // Create default config if none exists
      return this.tenantConfigModel.create({
        tenantId,
        settings: {
          theme: {
            primaryColor: '#000000',
          },
          features: {
            enableChat: true,
            enableNotifications: true,
          },
          limits: {
            maxUsers: 10,
            maxStorage: 5000000, // 5MB
          },
        },
      });
    }
    return config;
  }

  async updateConfig(
    tenantId: string,
    configUpdate: Partial<TenantConfig>,
  ): Promise<TenantConfig> {
    const config = await this.tenantConfigModel
      .findOneAndUpdate(
        { tenantId },
        { $set: configUpdate },
        { new: true, upsert: true },
      )
      .exec();

    if (!config) {
      throw new NotFoundException(`Configuration for tenant ${tenantId} not found`);
    }

    return config;
  }
}
