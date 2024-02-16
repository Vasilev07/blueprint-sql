import { Application } from "express";
import { AppDataSource } from "../data-source";
import { Administrator } from "../entity/administrator";
import { CryptoService } from "../services/crypto-service";
import { signForUser } from "../middleware/check-auth";

export const init = (app: Application) => {
    
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        const admin = await AppDataSource.manager.findOne(Administrator, { where: { email } });

        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await CryptoService.comparePasswords(password, admin.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Authentication failed' });
        }

        const token = signForUser(admin);

        res.json({ token });
    });

    app.post('/register', async (req, res) => {
        const isEmailAvailable = await AppDataSource.manager.findOne(Administrator, { where: { email: req.body.email } });
        console.log('isEmailAvailable', isEmailAvailable);
        console.log('req.body', req.body);
        
        if (isEmailAvailable !== null && isEmailAvailable !== undefined) {
            throw new Error('Email already in use');
        }

        if (req.body.password !== req.body.confirmPassword) {
            throw new Error('Passwords do not match');
        }
    
        const password = await CryptoService.hashPassword(req.body.password);
        
        const names = req.body.fullName.split(' ');

        const admin: Administrator = new Administrator();
        admin.email = req.body.email;
        admin.password = password;
        admin.firstname = names[0];
        admin.lastname = names[names.length - 1];

        try {
            await AppDataSource.manager.save(admin);
        } catch (error) {
            console.error('Error AppDataSource AppDataSource', error);
        }

        const token = signForUser(admin);
        
        res.json({ token });
    });
};