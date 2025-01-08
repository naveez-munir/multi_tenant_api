import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantName = req.headers['x-tenant-name'] as string;
    if(tenantName === 'admin') {
      next();
      return
    }

    if (!tenantName) {
      throw new NotFoundException('Tenant Name not provided');
    }

    try {
      const tenant = await this.tenantService.getTenantByName(tenantName);
      const connection = await this.tenantService.getTenantConnection(tenant._id.toString());

      // Attach tenant and connection to request object
      req['tenant'] = tenant;
      req['tenantConnection'] = connection;

      next();
    } catch (error) {
      throw new NotFoundException('Invalid tenant or connection failed');
    }
  }
}
