import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { ModelInitializationMiddleware } from 'src/common/middleware/model-initialization.middleware';

@Module({
  providers: [ClassService],
  controllers: [ClassController],
  exports: [ClassService],
})
export class ClassModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ModelInitializationMiddleware)
      .forRoutes({ path: 'classes*', method: RequestMethod.ALL });
  }
}


