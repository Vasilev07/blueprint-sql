import express, { Application } from 'express';
import { expressInit } from './confiigs/expressConfig';
import { port } from './confiigs/index';
import { routesInit } from './routes';

const app: Application = express();

expressInit(app);
routesInit(app);

app.listen(port, () => console.log(`Listening on ${port}`));


