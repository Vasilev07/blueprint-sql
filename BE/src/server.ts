import express, { Application } from 'express';
import { expressInit } from './confiigs/expressConfig';
import { routesInit } from './routes';

export const startServer = async (): Promise<any> => {
    const server: Application = express();
    
    expressInit(server);
    routesInit(server);

    return server;
};