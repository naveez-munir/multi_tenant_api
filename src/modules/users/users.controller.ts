import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, NotFoundException, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAllowedToCreateUserGuard } from 'src/common/decorators/is-admin-base-role.decorator';

@Controller('users')
@UseGuards(TenantGuard)
@UseGuards(JwtAuthGuard)
@UseGuards(IsAllowedToCreateUserGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request
  ) {
    // console.log('>>>>>>', req)
    return this.usersService.findUsers(
      req['tenantConnection'],
    );
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const user = await this.usersService.findById(
      req['tenantConnection'],
      id
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post()
  async create(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() userData: Partial<User>
  ) {
    return this.usersService.create(
      req['tenantConnection'],
      userData
    );
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateData: Partial<User>
  ) {
    const user = await this.usersService.updateUser(
      req['tenantConnection'],
      id,
      updateData
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Put(':id/password')
  async updatePassword(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() passwordData: { currentPassword: string; newPassword: string }
  ) {
    const updated = await this.usersService.updatePassword(
      req['tenantConnection'],
      id,
      passwordData.currentPassword,
      passwordData.newPassword
    );
    if (!updated) {
      throw new BadRequestException('Invalid current password');
    }
    return { message: 'Password updated successfully' };
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const deleted = await this.usersService.delete(
      req['tenantConnection'],
      id
    );
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  @Put(':id/status')
  async toggleStatus(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const user = await this.usersService.toggleUserStatus(
      req['tenantConnection'],
      id
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
