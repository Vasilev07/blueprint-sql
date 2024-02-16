import { Application } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/user";
import { CryptoService } from "../services/crypto-service";
import { Statuses } from "../utils/statuses";

export const init = (app: Application) => {
    app.get('/user', async (req, res) => {
        res.send('Hello World!');
        await AppDataSource.manager.find(User);
    });

    app.post('/register', async (req, res) => {
        const isEmailAvailable = await AppDataSource.manager.findOne(User, { where: { email: req.body.email } });
        console.log('isEmailAvailable', isEmailAvailable);
        console.log('req.body', req.body);
        
        if (!isEmailAvailable) {
            res.send(409).send({ error: 'Email already in use' });
        }

        const password = await CryptoService.hashPassword(req.body.password);
        const user: User = {
            ...req.body,
            password,
            confirmationPassword: password
        };
        console.log('user', user);
        
        res.status(Statuses.OK).send({});
    });
};