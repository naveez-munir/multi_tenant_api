import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../modules/users/users.service';
import { TenantService } from '../modules/tenant/tenant.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/users/schemas/user.schema';
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

  async validateUser(tenantName: string, email: string, password: string) {

    if (!tenantName) {
      const superAdmin = await this.userModel.findOne({
        email,
        role: UserRole.SUPER_ADMIN
      });

      if (superAdmin && await bcrypt.compare(password, superAdmin.password)) {
        return superAdmin;
      }
      return null;
    }

    const tenant = await this.tenantService.getTenantByName(tenantName);
    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant');
    }
    const connection = await this.tenantService.getTenantConnection(tenant._id.toString());
    const user = await this.usersService.findByEmail(connection, email);

    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: any, tenantName: string) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      tenantName: user.role === UserRole.SUPER_ADMIN ? null : tenantName
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
