import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { LeaveService } from './services/leave.service';
import { LeaveController } from './controller/leaveManagement.controller';

@Module({
  imports:[AuthModule],
  providers: [LeaveService],
  controllers: [LeaveController],
  exports: [LeaveService],
})
export class LeaveModule {}
