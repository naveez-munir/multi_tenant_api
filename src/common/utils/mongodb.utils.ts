import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

export class MongoDbUtils {

  static validateId(id: string, entityName = 'Resource'): Types.ObjectId {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${entityName} ID: ${id}`);
    }
    return new Types.ObjectId(id);
  }
  static toObjectIdOrNull(id?: string): Types.ObjectId | null {
    if (!id || !Types.ObjectId.isValid(id)) {
      return null;
    }
    return new Types.ObjectId(id);
  }

  static createIdFilter(id: string, fieldName = '_id'): Record<string, Types.ObjectId> {
    const objectId = this.validateId(id);
    return { [fieldName]: objectId };
  }
}
