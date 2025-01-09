import { Injectable } from '@nestjs/common';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema } from './schemas/user.schema';
import { ModelFactory } from '../common/factories/model.factory';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';

@Injectable()
export class UsersService {
  private getUserRepository(connection: Connection, tenantId: string) {
    const model = ModelFactory.createForConnection<User>(
      connection,
      'User',
      UserSchema
    );
    return new TenantAwareRepository(model, tenantId);
  }

  async createUser(
    connection: Connection,
    tenantId: string,
    userData: Partial<User>
  ) {
    const repository = this.getUserRepository(connection, tenantId);
    return repository.create(userData);
  }

  async findUsers(connection: Connection, tenantId: string) {
    const repository = this.getUserRepository(connection, tenantId);
    return repository.find();
  }

  async findByEmail(
    connection: Connection,
    tenantId: string,
    email: string
  ) {
    const repository = this.getUserRepository(connection, tenantId);
    const users = await repository.find({ email: email });
    return users[0];
  }

  async findById(
    connection: Connection,
    tenantId: string,
    id: string
  ) {
    const repository = this.getUserRepository(connection, tenantId);
    return repository.findById(id);
  }

  async updateUser(
    connection: Connection,
    tenantId: string,
    id: string,
    updateData: Partial<User>
  ) {
    const repository = this.getUserRepository(connection, tenantId);

    // Remove password from update data if present
    if (updateData.password) {
      delete updateData.password;
    }

    return repository.findOneAndUpdate(id, updateData);
  }

  async updatePassword(
    connection: Connection,
    tenantId: string,
    id: string,
    currentPassword: string,
    newPassword: string
  ) {
    const repository = this.getUserRepository(connection, tenantId);
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

  async deleteUser(
    connection: Connection,
    tenantId: string,
    id: string
  ) {
    const repository = this.getUserRepository(connection, tenantId);
    return repository.findOneAndDelete(id);
  }

  async toggleUserStatus(
    connection: Connection,
    tenantId: string,
    id: string
  ) {
    const repository = this.getUserRepository(connection, tenantId);
    return repository.toggleField(id, 'isActive');
  }
}
