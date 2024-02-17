import { Application, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Administrator } from "../entity/administrator";
import { cryptoService as cryptoService } from "../services/crypto-service";
import { signForUser } from "../middleware/check-auth";
import { administratorService } from "../services/administrator-service";
import { AdministratorDTO } from "../models/administrator-dto";

export const init = (app: Application) => {
    app.post('/login', async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const admin = await administratorService.findOneByEmail(email);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await cryptoService.comparePasswords(password, admin.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Authentication failed' });
        }

        const token = signForUser(admin);

        return res.json({ token });
    });

    app.post('/register', async (req: Request, res: Response) => {
        const dto: AdministratorDTO = req.body;
        
        try {
           const token = await administratorService.register(dto);
        
           return res.json({ token });
        } catch (error) {
            console.error('Error AppDataSource AppDataSource', error);
        }       
    });
};