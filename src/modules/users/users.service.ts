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

  async findUsers(connection: Connection) {
    const repository = this.getRepository(connection);
    return repository.find({}, { password: 0 });
  }

  async findById(
    connection: Connection,
    id: string
  ) {
    const repository = this.getRepository(connection);
    return repository.findById(id, { password: 0 });
  }

  async findByEmail(
    connection: Connection,
    email: string
  ) {
    const repository = this.getRepository(connection);
    const users = await repository.find({ email });
    return users[0] || null;
  }

  async updateUser(
    connection: Connection,
    id: string,
    updateData: Partial<User>
  ) {
    if (updateData.password) {
      delete updateData.password;
    }

    const repository = this.getRepository(connection);
    return repository.findOneAndUpdate(id, updateData);
  }

  async updatePassword(
    connection: Connection,
    id: string,
    currentPassword: string,
    newPassword: string
  ) {
    const repository = this.getRepository(connection);
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
    id: string
  ) {
    const repository = this.getRepository(connection);
    return repository.toggleField(id, 'isActive');
  }

  async findByIdentifier(connection: Connection, identifier: string) {
    const repository = this.getRepository(connection);
    return repository.findOne(
      { $or: [{ email: identifier }, { cnic: identifier }] }
    );
  }
}
