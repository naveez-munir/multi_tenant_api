import { Model, Document, FilterQuery, ProjectionType, UpdateQuery } from 'mongoose';
import { BaseRepository } from './base.repository';

export class TenantAwareRepository<T extends Document> extends BaseRepository<T> {
  constructor(model: Model<T>) {
    super(model);
  }

  async findById(id: string, projection?: ProjectionType<T>): Promise<T | null> {
    return this.model.findOne({ _id: id }, projection).exec();
  }

  async find(filter: FilterQuery<T> = {}, projection?: ProjectionType<T>): Promise<T[]> {
    return this.model.find(filter, projection).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async findByIdAndUpdate(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id },
        data,
        { new: true }
      )
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model
      .deleteOne({ _id: id })
      .exec();
    return result.deletedCount > 0;
  }

  async findOneAndUpdate(
    id: string,
    data: Partial<T>,
    options = { new: true }
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id },
        data,
        options
      )
      .exec();
  }

  async findOneAndDelete(id: string): Promise<T | null> {
    return this.model
      .findOneAndDelete({ _id: id })
      .exec();
  }

  async toggleField(id: string, field: keyof T): Promise<T | null> {
    const document = await this.findById(id);
    if (!document) return null;

    return this.findOneAndUpdate(id, {
      [field]: !document[field]
    } as Partial<T>);
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<T | null> {
    const result = await this.model
      .findOneAndUpdate(filter, update, { new: true })
      .exec();
    return result;
  }
}
