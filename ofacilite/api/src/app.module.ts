import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './common/config/env.validation';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { HealthModule } from './modules/health/health.module';
import { MistralModule } from './modules/mistral/mistral.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.getOrThrow<number>('THROTTLE_TTL_MS'),
          limit: config.getOrThrow<number>('THROTTLE_LIMIT'),
        },
      ],
    }),
    HealthModule,
    MistralModule,
    UploadsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class AppModule {}
