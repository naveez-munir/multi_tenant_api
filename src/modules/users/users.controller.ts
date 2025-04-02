import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAllowedToCreateUserGuard } from 'src/common/decorators/is-admin-base-role.decorator';
import { UserRole } from 'src/common/interfaces/roleEnum';
import { StudentSchema } from '../student/schemas/student.schema';
import { TeacherSchema } from '../teacher/schemas/teacher.schema';
import { StaffSchema } from '../staff/schema/staff.schema';
import { GuardianSchema } from '../student/schemas/guardian.schema';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, IsAllowedToCreateUserGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Req() req: Request) {
    return this.usersService.findUsers(req['tenantConnection']);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = await this.usersService.findById(req['tenantConnection'], id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post()
  async create(@Req() req: Request, @Body() userData: Partial<User>) {
    try {
      const connection = req['tenantConnection'];
      let entityModel;
      let entityType;
      if (userData.role === UserRole.STUDENT) {
        entityModel = connection.model('Student', StudentSchema);
        entityType = 'student';
      } else if (userData.role === UserRole.TEACHER) {
        entityModel = connection.model('Teacher', TeacherSchema);
        entityType = 'teacher';
      } else if (userData.role === UserRole.PARENT) {
        entityModel = connection.model('Guardian', GuardianSchema);
        entityType = 'teacher';
      } else if (
        [
          UserRole.ACCOUNTANT,
          UserRole.LIBRARIAN,
          UserRole.ADMIN,
          UserRole.PRINCIPAL,
          UserRole.DRIVER,
          UserRole.SECURITY,
          UserRole.CLEANER,
          UserRole.TENANT_ADMIN,
        ].includes(userData.role)
      ) {
        entityModel = connection.model('Staff', StaffSchema);
        entityType = 'staff member';
      }

      if (entityModel) {
        const entity = await entityModel.findOne({ cniNumber: userData.cnic });
        if (!entity) {
          throw new BadRequestException(
            `No ${entityType} found with the provided CNIC number`,
          );
        }
      }

      const user = await this.usersService.create(connection, userData);
      if (entityModel) {
        await entityModel.findOneAndUpdate(
          { cniNumber: user.cnic },
          { userId: user._id },
        );
      }

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateData: Partial<User>,
  ) {
    const user = await this.usersService.updateUser(
      req['tenantConnection'],
      id,
      updateData,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Put(':id/password')
  async updatePassword(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() passwordData: { currentPassword: string; newPassword: string },
  ) {
    const updated = await this.usersService.updatePassword(
      req['tenantConnection'],
      id,
      passwordData.currentPassword,
      passwordData.newPassword,
    );
    if (!updated) {
      throw new BadRequestException('Invalid current password');
    }
    return { message: 'Password updated successfully' };
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const deleted = await this.usersService.delete(req['tenantConnection'], id);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  @Put(':id/status')
  async toggleStatus(@Req() req: Request, @Param('id') id: string) {
    const user = await this.usersService.toggleUserStatus(
      req['tenantConnection'],
      id,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
