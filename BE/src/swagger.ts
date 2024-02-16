import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'My API',
        version: '1.0.0',
        description: 'My API Description',
    },
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.ts'], // Path to the API routes in your Node.js application
};

export const swaggerSpec = swaggerJSDoc(options);