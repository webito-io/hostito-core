import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export function setupSwagger(app: INestApplication) {

  const config = new DocumentBuilder()
    .setTitle('Hostito API')
    .setDescription(
      'Open source hosting billing & management system — WHMCS alternative.\n\n' +
      '[View on GitHub](https://github.com/webito-io/hostito-core)',
    )
    .setVersion('0.1.0')
    .setExternalDoc('GitHub Repository', 'https://github.com/webito-io/hostito-core')
    .addBearerAuth()
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(
    app,
    config,
  );

  app.use(
    '/api',
    apiReference({
      spec: { content: document },
      theme: 'kepler',
    }),
  );
}
