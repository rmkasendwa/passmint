import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, static as serveStatic, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  const webPort = config.get<string>('WEB_PORT') ?? '8088';

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN') ?? `http://localhost:${webPort}`,
  });
  app.use(
    '/uploads',
    serveStatic(
      config.get<string>('LOCAL_UPLOAD_DIR') ?? join(process.cwd(), 'uploads'),
    ),
  );
  app.use(json({ limit: '7mb' }));
  app.use(urlencoded({ extended: true, limit: '7mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port =
    config.get<string>('PORT') ?? config.get<string>('API_PORT') ?? '3000';
  await app.listen(port);
}

bootstrap();
