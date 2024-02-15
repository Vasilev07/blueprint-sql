import { NextFunction, Request, Response } from 'express';
import passport from 'passport';

export const init = (app: any) => {
    app.post('/login', (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate('local', (err: any, user: any, info: any) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(300).json(info);
            }
            return req.login(user, (error) => {
                if (error) {
                    return res.status(300).json(info);
                }

                return res.redirect('/index');
            });
        })(req, res, next);
    });

    app.get('/logout', (request: Request, response: Response) => {
        request.logout();
        console.log(request.isAuthenticated());
        response.redirect('/');
    });
};