import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Connection } from 'mongoose';
import { ClassSchema } from 'src/modules/class/schemas/class.schema';
import { StudentSchema } from 'src/modules/student/schemas/student.schema';
import { CounterSchema } from '../schemas/counter.schema';
import { GuardianSchema } from 'src/modules/student/schemas/guardian.schema';

@Injectable()
export class ModelInitializationMiddleware implements NestMiddleware {
  private modelDefinitions = [
    { name: 'Student', schema: StudentSchema },
    { name: 'Class', schema: ClassSchema },
    { name: 'Counter', schema: CounterSchema },
    { name: 'Guardian', schema: GuardianSchema }
  ];

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const connection: Connection = (req as any).tenantConnection;
      if (!connection) {
        throw new BadRequestException('Tenant database connection not established');
      }
  
      for (const { name, schema } of this.modelDefinitions) {
        if (!connection.models[name]) {
          connection.model(name, schema);
        }
      }
      
      next();
    } catch (error) {
      console.error('Model initialization error:', error);
      throw new BadRequestException('Failed to initialize database models');
    }
  }
}
