import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from 'src/common/interfaces/roleEnum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
      super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const canActivate = await super.canActivate(context);
      if (!canActivate) {
        return false;
      }
    
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (user.role === UserRole.SUPER_ADMIN) {
        return true;
      }
    
      if (!user.tenant || !user.tenantConnection) {
        console.error('❌ Tenant or Tenant Connection missing in user payload!');
        return false;
      }
      //TODO check we might not need to set the db connection here
      request.tenant = user.tenant;
      request.userRole = user.role;
      request.userId = user.userId;
      request.tenantConnection = user.tenantConnection;

      return true;
    }
}
