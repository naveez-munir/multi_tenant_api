import { Model, Document, FilterQuery, ProjectionType } from 'mongoose';
import { BaseRepository } from './base.repository';

export class TenantAwareRepository<T extends Document> extends BaseRepository<T> {
  constructor(model: Model<T>, private readonly tenantId: string) {
    super(model);
  }

  private addTenantContext(filter: FilterQuery<T> = {}): FilterQuery<T> {
    return { ...filter, tenantId: this.tenantId };
  }

  override async findById(id: string,projection?: ProjectionType<T>): Promise<T | null> {
    return this.model.findOne(this.addTenantContext({ _id: id }), projection).exec();
  }

  override async find(filter: FilterQuery<T> = {}, projection?: ProjectionType<T>): Promise<T[]> {
    return this.model.find(this.addTenantContext(filter), projection).exec();
  }

  override async create(data: Partial<T>): Promise<T> {
    const entity = new this.model({
      ...data,
      tenantId: this.tenantId,
    });
    return entity.save();
  }

  override async findByIdAndUpdate(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        this.addTenantContext({ _id: id }),
        data,
        { new: true }
      )
      .exec();
  }

  override async delete(id: string): Promise<boolean> {
    const result = await this.model
      .deleteOne(this.addTenantContext({ _id: id }))
      .exec();
    return result.deletedCount > 0;
  }

  // Additional tenant-specific methods
  async findOneAndUpdate(
    id: string,
    data: Partial<T>,
    options = { new: true }
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        this.addTenantContext({ _id: id }),
        data,
        options
      )
      .exec();
  }

  async findOneAndDelete(id: string): Promise<T | null> {
    return this.model
      .findOneAndDelete(this.addTenantContext({ _id: id }))
      .exec();
  }

  async toggleField(id: string, field: keyof T): Promise<T | null> {
    const document = await this.findById(id);
    if (!document) return null;

    return this.findOneAndUpdate(id, {
      [field]: !document[field]
    } as Partial<T>);
  }
}
