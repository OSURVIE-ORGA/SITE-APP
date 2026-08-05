import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MistralModule } from './modules/mistral/mistral.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MistralModule,
  ],
})
export class AppModule {}

