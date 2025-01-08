import { Injectable } from '@nestjs/common';
import { Connection } from 'mongoose';
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
    const users =  await repository.find({email: email});
    return users[0]; // Get first matching user
  }

  // Add other user-related methods as needed
}
