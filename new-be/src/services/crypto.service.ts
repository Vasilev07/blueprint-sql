import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class CryptoService {
    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;

        return await bcrypt.hash(password, saltRounds);
    }

    async comparePasswords(password: string, hash: any): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}
