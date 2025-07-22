const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'My API',
    description: 'API Documentation for My Backend',
    version: '1.0.0',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
};

const outputFile = './swagger-output.json';

// Create an entry point file that includes all routes with their proper paths
const endpointsFiles = ['./swagger-routes.ts'];

// Generate Swagger documentation
swaggerAutogen(outputFile, endpointsFiles, doc);