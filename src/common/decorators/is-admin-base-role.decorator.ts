import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../interfaces/roleEnum';

@Injectable()
export class IsAllowedToCreateUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userRole = request.userRole;

    if (!userRole || !(userRole === UserRole.SUPER_ADMIN || userRole === UserRole.TENANT_ADMIN || userRole === UserRole.ADMIN)) {
      throw new UnauthorizedException('You do not have permission to create a user.');
    }

    return true;
  }
}
