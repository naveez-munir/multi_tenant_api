import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TenantService } from '../../modules/tenant/tenant.service';
import { UserRole } from 'src/common/interfaces/roleEnum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private tenantService: TenantService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { userId, role, tenantName } = payload;
  
    if (role === UserRole.SUPER_ADMIN) {
      return { userId, role, tenantName };
    }

    const tenant = await this.tenantService.getTenantByName(tenantName);
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Invalid tenant or tenant is inactive');
    }
    const connection = await this.tenantService.getTenantConnection(tenant._id.toString());
    return { userId, role, tenantName, tenant, tenantConnection: connection };
  }
}
