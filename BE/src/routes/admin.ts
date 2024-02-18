import { Application, Request, Response } from "express";
import { cryptoService as cryptoService } from "../services/crypto-service";
import { checkAuth, signForUser } from "../middleware/check-auth";
import { administratorService } from "../services/administrator-service";
import { AdministratorDTO } from "../models/administrator-dto";
import { AdministratorLoginDTO } from "../models/administrator-login-dto";
import { Administrator } from "../entity/administrator";

export const init = (app: Application) => {
    app.post('/login', async (req: Request, res: Response) => {
        const dto: AdministratorLoginDTO = req.body;

        const admin = await administratorService.findOneByEmail(dto.email);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await cryptoService.comparePasswords(dto.password, admin.password);

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

    app.get('/all', checkAuth, async (req: Request, res: Response) => {
        const admins: Administrator[] = await administratorService.getAll();

        return res.json(admins);
    });
};