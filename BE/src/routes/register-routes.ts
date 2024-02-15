import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { UserController } from '../controllers/user-controller';
import { IUser } from '../interfaces/user-interface';

export const init = (app: any): void => {
    const userController = new UserController();

    app.post('/validate', async (request: Request, response: Response, next: NextFunction) => {
        const userModel = request.body;

        const userObject: IUser = {
            username: userModel.username,
            email: userModel.email,
            firstname: userModel.firstName,
            lastname: userModel.lastName,
            password: userModel.password,
            confirmationPassword: userModel.rePassword,
        };

        try {
            await userController.createUser(userObject);
            passport.authenticate('local', (err: Error, user: IUser, info: any) => {
    
                if (err) {
                    return next(err);
                }

                if (!user) {
                    return response.redirect('/');
                }

                request.logIn(user, (error) => {
                    if (error) {
                        return next(error);
                    }
                    return response.status(200).redirect('/index');
                });
            })(request, response, next);
        } catch (err) {
            console.log(err);
            response.status(400).json(err);
        }
    }, passport.authenticate('local', {
        successRedirect: '/index',
    }));
};
