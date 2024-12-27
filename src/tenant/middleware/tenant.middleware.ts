import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new NotFoundException('Tenant ID not provided');
    }

    try {
      const tenant = await this.tenantService.getTenantById(tenantId);
      const connection = await this.tenantService.getTenantConnection(tenantId);

      // Attach tenant and connection to request object
      req['tenant'] = tenant;
      req['tenantConnection'] = connection;

      next();
    } catch (error) {
      throw new NotFoundException('Invalid tenant or connection failed');
    }
  }
}
