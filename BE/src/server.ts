import express, { Application } from 'express';
import { expressInit } from './configs/expressConfig';
import { routesInit } from './routes';
import { AppDataSource } from './data-source';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = require('./swagger-output.json');

export const startServer = async (): Promise<any> => {

    AppDataSource.initialize()
        .then(() => {
            console.log("Data Source has been initialized!");
        })
        .catch((err) => {
            console.error("Error during Data Source initialization", err);
        });
    
    const server: Application = express();
    
    expressInit(server);
    routesInit(server);

    if (swaggerDocument) {
        server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }

    return server;
};