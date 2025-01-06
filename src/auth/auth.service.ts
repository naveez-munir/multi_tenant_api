import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/schemas/user.schema';
import { Model } from 'mongoose';
import { UserRole } from 'src/common/interfaces/roleEnum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private tenantService: TenantService,
  ) {}

  async validateUser(tenantId: string, email: string, password: string) {

    if (!tenantId) {
      const superAdmin = await this.userModel.findOne({
        email,
        role: UserRole.SUPER_ADMIN
      });

      if (superAdmin && await bcrypt.compare(password, superAdmin.password)) {
        return superAdmin;
      }
      return null;
    }

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
      role: user.role,
      tenantId: user.role === UserRole.SUPER_ADMIN ? null : tenantId
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
