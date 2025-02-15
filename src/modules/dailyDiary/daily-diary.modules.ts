import { Module } from '@nestjs/common';
import { DailyDiaryController } from './daily-diary.controller';
import { DailyDiaryService } from './daily-diary.service';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    StudentModule,
  ],
  controllers: [
    DailyDiaryController
  ],
  providers: [
    DailyDiaryService
  ],
  exports: [
    DailyDiaryService
  ]
})
export class DailyDiaryModule {}
