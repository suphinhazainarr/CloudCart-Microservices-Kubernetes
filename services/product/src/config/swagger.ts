import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CloudCart Product Service',
      version: '1.0.0',
      description: 'Product Management APIs'
    },
    servers: [
      {
        url: '/api/products'
      }
    ]
  },

  apis: [
    // Use forward slashes explicitly — swagger-jsdoc glob patterns break on Windows backslashes
    `${__dirname.replace(/\\/g, '/')}/../routes/*.ts`,
    `${__dirname.replace(/\\/g, '/')}/../routes/*.js`,
  ]
};

export const setupSwagger = (app: Express) => {
  const swaggerSpec = swaggerJsdoc(options);

  app.use(
    '/api/products/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );

  console.warn(
    `Swagger UI: http://localhost:4002/api/products/docs`
  );
};