import { Model, Document, FilterQuery } from 'mongoose';

export class TenantAwareRepository<T extends Document> {
  constructor(
    private readonly model: Model<T>,
    private readonly tenantId: string,
  ) {}

  private addTenantContext(filter: FilterQuery<T> = {}): FilterQuery<T> {
    return { ...filter, tenantId: this.tenantId };
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findOne(this.addTenantContext({ _id: id })).exec();
  }

  async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(this.addTenantContext(filter)).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model({
      ...data,
      tenantId: this.tenantId,
    });
    return entity.save();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        this.addTenantContext({ _id: id }),
        data,
        { new: true }
      )
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model
      .deleteOne(this.addTenantContext({ _id: id }))
      .exec();
    return result.deletedCount > 0;
  }
}
