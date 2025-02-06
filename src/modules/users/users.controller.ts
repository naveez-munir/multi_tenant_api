import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, NotFoundException, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { User } from './schemas/user.schema';

@Controller('users')
@UseGuards(TenantGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request
  ) {
    return this.usersService.findUsers(
      req['tenantConnection'],
      tenant._id.toString()
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
      tenant._id.toString(),
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
      tenant._id.toString(),
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
      tenant._id.toString(),
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
      tenant._id.toString(),
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
      tenant._id.toString(),
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
      tenant._id.toString(),
      id
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
