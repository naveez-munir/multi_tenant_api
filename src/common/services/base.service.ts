import { Connection, Document } from 'mongoose';
import { ModelFactory } from '../factories/model.factory';
import { TenantAwareRepository } from '../repositories/tenant-aware.repository';

export abstract class BaseService<T extends Document> {
  constructor(
    private readonly modelName: string,
    private readonly schema: any,
  ) {}

  protected getRepository(connection: Connection, tenantId: string): TenantAwareRepository<T> {
    const model = ModelFactory.createForConnection<T>(
      connection,
      this.modelName,
      this.schema
    );
    return new TenantAwareRepository<T>(model, tenantId);
  }

  async findById(connection: Connection, tenantId: string, id: string): Promise<T | null> {
    const repository = this.getRepository(connection, tenantId);
    return repository.findById(id);
  }

  async find(connection: Connection, tenantId: string): Promise<T[]> {
    const repository = this.getRepository(connection, tenantId);
    return repository.find();
  }

  async create(connection: Connection, tenantId: string, data: Partial<T>): Promise<T> {
    const repository = this.getRepository(connection, tenantId);
    return repository.create(data);
  }

  async findByIdAndUpdate(connection: Connection, tenantId: string, id: string, data: Partial<T>): Promise<T | null> {
    const repository = this.getRepository(connection, tenantId);
    return repository.findByIdAndUpdate(id, data);
  }

  async delete(connection: Connection, tenantId: string, id: string): Promise<boolean> {
    const repository = this.getRepository(connection, tenantId);
    return repository.delete(id);
  }
}
