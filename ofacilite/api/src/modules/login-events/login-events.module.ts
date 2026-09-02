import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginEvent } from './login-event.entity';
import { LoginEventsService } from './login-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([LoginEvent])],
  providers: [LoginEventsService],
  exports: [LoginEventsService],
})
export class LoginEventsModule {}
