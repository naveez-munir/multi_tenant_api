import { Injectable } from '@nestjs/common';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema } from './schemas/user.schema';
import { BaseService } from 'src/common/services/base.service';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor() {
    super('User', UserSchema);
  }

  async findUsers(connection: Connection, tenantId: string) {
    const repository = this.getRepository(connection, tenantId);
    return repository.find({}, { password: 0 });
  }

  async findById(
    connection: Connection,
    tenantId: string,
    id: string
  ) {
    const repository = this.getRepository(connection, tenantId);
    return repository.findById(id, { password: 0 });
  }

  async findByEmail(
    connection: Connection,
    tenantId: string,
    email: string
  ) {
    const repository = this.getRepository(connection, tenantId);
    const users = await repository.find({ email });
    return users[0] || null;
  }

  async updateUser(
    connection: Connection,
    tenantId: string,
    id: string,
    updateData: Partial<User>
  ) {
    if (updateData.password) {
      delete updateData.password;
    }

    const repository = this.getRepository(connection, tenantId);
    return repository.findOneAndUpdate(id, updateData);
  }

  async updatePassword(
    connection: Connection,
    tenantId: string,
    id: string,
    currentPassword: string,
    newPassword: string
  ) {
    const repository = this.getRepository(connection, tenantId);
    const user = await repository.findById(id);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return repository.findOneAndUpdate(id, { password: hashedPassword });
  }

  async toggleUserStatus(
    connection: Connection,
    tenantId: string,
    id: string
  ) {
    const repository = this.getRepository(connection, tenantId);
    return repository.toggleField(id, 'isActive');
  }
}
