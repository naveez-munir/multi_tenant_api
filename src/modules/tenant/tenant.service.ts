import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { DatabaseService } from '../../database/database.service';
import { ConnectionManager } from './connection-manager';
import { UsersService } from 'src/modules/users/users.service';
import { UserRole } from 'src/common/interfaces/roleEnum';

@Injectable()
export class TenantService {
  private readonly tenantConnections = new Map();

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private databaseService: DatabaseService,
    private connectionManager: ConnectionManager,
    private userService: UsersService
  ) {}

  async createTenant(tenantData: Partial<Tenant>): Promise<TenantDocument> {
    const savedTenant = await this.tenantModel.create({
      name: tenantData.name,
      databaseName: tenantData.databaseName
    });
    // Create a new connection for the tenant
    const tenantConnection = await this.databaseService.createTenantConnection(savedTenant.databaseName);

    //TODO create tenant super admin
    const tenantAdminUser = {
      name: 'Tenant Admin',
      email: `tenantadmin@${savedTenant.name}.com`,
      role: UserRole.TENANT_ADMIN,
      password: 'password',
      tenantId: savedTenant._id.toString(),
    };
    await this.userService.create(tenantConnection, savedTenant._id.toString(), tenantAdminUser);
    return savedTenant;
  }

  async getTenantById(id: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }
  async getTenantByName(name: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findOne({name: name});
    if (!tenant) {
      throw new NotFoundException(`Tenant with name ${name} not found`);
    }
    return tenant;
  }

  async getTenantConnection(tenantId: string) {
    if (!this.connectionManager.has(tenantId)) {
      const tenant = await this.getTenantById(tenantId);

      if (tenant.status !== 'active') {
        throw new Error('Tenant is not active');
      }

      const connection = await this.databaseService.createTenantConnection(
        tenant.databaseName,
      );
      this.connectionManager.set(tenantId, connection);
    }

    return this.connectionManager.get(tenantId);
  }

  async getAllTenants(): Promise<TenantDocument[]> {
    return this.tenantModel.find().exec();
  }

  async updateTenant(
    id: string,
    updateData: Partial<Tenant>,
  ): Promise<TenantDocument> {
    const tenant = await this.tenantModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    const result = await this.tenantModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Close and delete the connection if it exists
    if (this.tenantConnections.has(id)) {
      const connection = this.tenantConnections.get(id);
      await connection.close();
      this.tenantConnections.delete(id);
    }
  }
}
