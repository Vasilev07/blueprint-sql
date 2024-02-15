import { NextFunction, Request, Response } from 'express';
import path from 'path';

export const init = (app: any): void => {
    // console.log(data);

    app.set('views', path.join(__dirname, '../views'));

    app.get('/', (request: Request, response: Response, next: NextFunction) => {
        // response.send('Hello Georgi!');
        response.render('../views/index.pug');
    });
};
