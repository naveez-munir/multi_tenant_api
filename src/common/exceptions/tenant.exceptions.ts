import { HttpException, HttpStatus } from '@nestjs/common';

export class TenantNotFoundException extends HttpException {
  constructor(tenantId: string) {
    super(`Tenant with ID ${tenantId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InactiveTenantException extends HttpException {
  constructor(tenantId: string) {
    super(`Tenant ${tenantId} is inactive`, HttpStatus.FORBIDDEN);
  }
}

export class TenantConnectionException extends HttpException {
  constructor(message: string) {
    super(`Database connection error: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
