import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { MongoDbUtils } from '../utils/mongodb.utils';

@Injectable()
export class QueryBuilderService {
  buildSearchQuery(
    params: Record<string, any>, 
    fieldMappings: Record<string, any> = {}
  ): Record<string, any> {
    const query: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      if (key in fieldMappings) {
        const mapping = fieldMappings[key];
        if (typeof mapping === 'function') {
          const result = mapping(value);
          if (result !== null && result !== undefined) {
            Object.assign(query, result);
          }
        }
        else if (typeof mapping === 'string') {
          query[mapping] = value;
        }
        else if (typeof mapping === 'object') {
          Object.assign(query, mapping);
        }
        
        continue;
      }

      if (typeof value === 'string') {
        if (Types.ObjectId.isValid(value) && value.match(/^[0-9a-fA-F]{24}$/)) {
          query[key] = new Types.ObjectId(value);
        }
        else {
          query[key] = { $regex: value, $options: 'i' };
        }
      } else {
        query[key] = value;
      }
    }
    
    return query;
  }

  buildStudentSearchQuery(searchDto: any): Record<string, any> {
    const fieldMappings = {
      guardianId: (value: string) => {
        const guardianId = MongoDbUtils.toObjectIdOrNull(value);
        return guardianId ? { guardian: guardianId } : null;
      },
      guardianCnic: null,
      section: (value: string) => {
        const sectionId = MongoDbUtils.toObjectIdOrNull(value);
        return sectionId ? { section: sectionId } : null;
      }
    };
    
    return this.buildSearchQuery(searchDto, fieldMappings);
  }
}
