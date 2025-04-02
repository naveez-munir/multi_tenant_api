import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ModelInitializationMiddleware } from 'src/common/middleware/model-initialization.middleware';
import { QueryBuilderService } from 'src/common/services/query-builder.service';

@Module({
  imports:[AuthModule],
  providers: [TeacherService,QueryBuilderService],
  controllers: [TeacherController],
  exports: [TeacherService],
})
export class TeacherModule {
  configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(ModelInitializationMiddleware)
        .forRoutes({ path: 'classes*', method: RequestMethod.ALL });
    }
}
