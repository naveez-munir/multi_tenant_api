import { MiddlewareConsumer, Module,RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './tenant/tenant.module';
import configuration from './config/configuration';
import { databaseConfig } from './config/database.config';
import { TenantMiddleware } from './tenant/middleware/tenant.middleware';
import { ConnectionManager } from './tenant/connection-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    TenantModule,
  ],
  providers: [ConnectionManager],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        'health/(.*)',
      )
      .forRoutes('*');
  }
}
