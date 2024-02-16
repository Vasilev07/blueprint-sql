import express, { Application } from 'express';
import { expressInit } from './configs/expressConfig';
import { routesInit } from './routes';
import { AppDataSource } from './data-source';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

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
    server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    return server;
};