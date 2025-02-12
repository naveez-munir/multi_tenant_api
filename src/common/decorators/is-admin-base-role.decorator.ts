import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../interfaces/roleEnum';

@Injectable()
export class IsAllowedToCreateUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException('User authentication required');
    }

    const hasPermission = [
      UserRole.SUPER_ADMIN,
      UserRole.TENANT_ADMIN,
      UserRole.ADMIN
    ].includes(user.role);

    if (!hasPermission) {
      throw new UnauthorizedException('You do not have permission to perform this action');
    }

    return true;
  }
}
