import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './common/scalar/scalar.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Docs
  setupSwagger(app);
  
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();