import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
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

  @Post()
  async create(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() userData: Partial<User>
  ) {
    return this.usersService.createUser(
      req['tenantConnection'],
      tenant._id.toString(),
      userData
    );
  }
}
