import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TenantService } from '../../tenant/tenant.service';

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
    const { userId, tenantId } = payload;
    const tenant = await this.tenantService.getTenantById(tenantId);

    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Invalid tenant or tenant is inactive');
    }

    return { userId, tenantId };
  }
}
