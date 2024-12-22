import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from '../../tenant/tenant.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private tenantService: TenantService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First verify JWT token
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verify tenant and setup connection
    try {
      const tenant = await this.tenantService.getTenantById(user.tenantId);
      const connection = await this.tenantService.getTenantConnection(user.tenantId);

      request.tenant = tenant;
      request.tenantConnection = connection;

      return true;
    } catch (error) {
      return false;
    }
  }
}
