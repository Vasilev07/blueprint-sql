import { Application } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/user";

export const init = (app: Application) => {
    app.get('/user', async (req, res) => {
        res.send('Hello World!');
        await AppDataSource.manager.find(User);
    });
};