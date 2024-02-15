import bcrypt from 'bcrypt';

export class CryptoService {

    public async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    public async comparePasswords(password: string, hash: any): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}