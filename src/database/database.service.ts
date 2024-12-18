import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';

@Injectable()
export class DatabaseService {
  constructor(private configService: ConfigService) {}

  async createTenantConnection(tenantId: string): Promise<mongoose.Connection> {
    const uriTemplate = this.configService.get<string>('database.uriTemplate');
    const uri = uriTemplate.replace('{{tenantId}}', tenantId);

    const connection = await mongoose.createConnection(uri);
    return connection;
  }
}
