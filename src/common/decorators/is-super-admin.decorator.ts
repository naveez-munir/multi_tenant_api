import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../interfaces/roleEnum';

export const IsSuperAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    console.log(user);

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can access this resource');
    }

    return user;
  },
);
