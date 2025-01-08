import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { UserRole } from 'src/common/interfaces/roleEnum';

@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing application...');
    await this.createSuperAdmin();
  }

  private async createSuperAdmin() {
    try {
      const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
      const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
      const name = this.configService.get<string>('SUPER_ADMIN_NAME');

      if (!email || !password || !name) {
        throw new Error('Super admin configuration missing in environment variables');
      }

      const existingSuperAdmin = await this.userModel.findOne({ role: 'super_admin' });

      if (!existingSuperAdmin) {
        const user = await this.userModel.create({
          email,
          password,
          name,
          role: UserRole.SUPER_ADMIN,
          isActive: true
        });

        this.logger.log('Super admin created successfully', user);
      } else {
        this.logger.log('Super admin already exists');
      }
    } catch (error) {
      this.logger.error('Failed to create super admin:', error.message);
    }
  }
}
