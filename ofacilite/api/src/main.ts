import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import type { Response } from 'express';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './modules/uploads/uploads-reaper.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');
  const port = config.getOrThrow<number>('PORT');
  const clientUrl = config.get<string>('CLIENT_URL');

  app.enableShutdownHooks();
  // Behind nginx: trust the first proxy hop so req.ip / rate-limiting use the
  // real client address from X-Forwarded-For.
  app.set('trust proxy', 1);
  app.use(helmet({ referrerPolicy: { policy: 'no-referrer' } }));

  // The mobile app is a native client (no Origin, not CORS-bound). Lock this
  // down only if a browser frontend also calls the API (set CLIENT_URL).
  app.enableCors({
    origin: clientUrl ?? true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Serve the scanned photos back to the app. They are user-uploaded, so pin a
  // safe disposition and forbid the browser from ever treating one as an
  // active document.
  app.useStaticAssets(UPLOAD_DIR, {
    prefix: '/uploads/',
    index: false,
    setHeaders: (res: Response) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('Cache-Control', 'private, max-age=86400');
    },
  });

  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API listening on :${port} (${nodeEnv})`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
