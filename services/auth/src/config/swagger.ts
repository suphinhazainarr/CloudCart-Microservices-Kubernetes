import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'CloudCart Auth Service API',
      version:     '1.0.0',
      description: 'Authentication and authorisation endpoints for CloudCart',
    },
    servers: [{ url: 'http://localhost:4001', description: 'Development' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in:   'cookie',
          name: 'accessToken',
        },
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],  // JSDoc comments are read from route files
};

export const setupSwagger = (app: Express): void => {
  const swaggerSpec = swaggerJsdoc(options);
  app.use('/api/auth/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.warn(`Swagger UI: http://localhost:4001/api/auth/docs`);
};
