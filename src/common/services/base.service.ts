import { Connection, Document } from 'mongoose';
import { ModelFactory } from '../factories/model.factory';
import { TenantAwareRepository } from '../repositories/tenant-aware.repository';

export abstract class BaseService<T extends Document> {
  constructor(
    private readonly modelName: string,
    private readonly schema: any,
  ) {}

  protected getRepository(connection: Connection): TenantAwareRepository<T> {
    const model = ModelFactory.createForConnection<T>(
      connection,
      this.modelName,
      this.schema
    );
    return new TenantAwareRepository<T>(model);
  }

  async findById(connection: Connection, id: string): Promise<T | null> {
    const repository = this.getRepository(connection);
    return repository.findById(id);
  }

  async find(connection: Connection): Promise<T[]> {
    const repository = this.getRepository(connection);
    return repository.find();
  }

  async create(connection: Connection, data: Partial<T>): Promise<T> {
    const repository = this.getRepository(connection);
    return repository.create(data);
  }

  async findByIdAndUpdate(connection: Connection, id: string, data: Partial<T>): Promise<T | null> {
    const repository = this.getRepository(connection);
    return repository.findByIdAndUpdate(id, data);
  }

  async delete(connection: Connection, id: string): Promise<boolean> {
    const repository = this.getRepository(connection);
    return repository.delete(id);
  }
}
