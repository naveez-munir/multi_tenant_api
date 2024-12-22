import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private tenantService: TenantService,
  ) {}

  async validateUser(tenantId: string, email: string, password: string) {
    const tenant = await this.tenantService.getTenantById(tenantId);
    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant');
    }

    const connection = await this.tenantService.getTenantConnection(tenantId);
    const user = await this.usersService.findByEmail(connection, tenantId, email);

    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: any, tenantId: string) {
    const payload = {
      userId: user._id,
      email: user.email,
      tenantId
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
