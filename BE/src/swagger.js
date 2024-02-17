const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = require('./swagger-output.json');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hello World',
            version: '1.0.0',
        },
    },
    apis: [
        './routes/'
    ], // files containing annotations as above
};
console.log('KZL', JSON.parse(JSON.stringify(swaggerSpec)));

const openapiSpecification = swaggerJsdoc(options);
module.exports = openapiSpecification;