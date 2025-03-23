import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { ExceptionInterceptor } from '../../common/interceptors/exception.interceptor';
import { ModelInitializationMiddleware } from '../../common/middleware/model-initialization.middleware';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { QueryBuilderService } from '../../common/services/query-builder.service';

@Module({
  controllers: [StudentController],
  providers: [
    StudentService,
    SequenceGeneratorService,
    QueryBuilderService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ExceptionInterceptor
    }
  ],
  exports: [StudentService]
})
export class StudentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ModelInitializationMiddleware)
      .forRoutes(StudentController);
  }
}
