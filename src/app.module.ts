import { MiddlewareConsumer, Module,RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './modules/tenant/tenant.module';
import configuration from './config/configuration';
import { databaseConfig } from './config/database.config';
import { TenantMiddleware } from './modules/tenant/middleware/tenant.middleware';
import { ConnectionManager } from './modules/tenant/connection-manager';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './modules/subject/subject.module';
import { ClassModule } from './modules/class/class.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ExamModule } from './modules/exam/exam.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { DailyDiaryModule } from './modules/dailyDiary/daily-diary.modules';
import { AttendanceModule } from './modules/Attendance/attendance.module';
import { StaffModule } from './modules/staff/staff.module';
import { LeaveModule } from './modules/leave/leave.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    TenantModule,
    SubjectModule,
    ClassModule,
    TeacherModule,
    ExamModule,
    AccountsModule,
    AttendanceModule,
    DailyDiaryModule,
    StaffModule,
    AuthModule,
    LeaveModule,
    AccountsModule,
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
        { path: 'health/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
