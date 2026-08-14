import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const webPort = config.get<string>('WEB_PORT') ?? '8088';

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN') ?? `http://localhost:${webPort}`,
  });
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
