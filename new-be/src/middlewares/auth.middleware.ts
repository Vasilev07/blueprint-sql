import { Injectable, NestMiddleware } from "@nestjs/common";
import { verify, sign } from "jsonwebtoken";
import { Administrator } from "src/entities/administrator.entity";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    use(req: any, res: any, next: (error?: any) => void) {
        const token = req.headers.authorization?.split(" ")[1] as any;
        const decoded = verify(token, "secred");

        if (!decoded) {
            res.status(401).json({ message: "failed" });
        }

        req.userData = decoded;

        next();
    }

    signForUser(admin: Administrator) {
        return sign({ name: admin.lastname, email: admin.email }, "secred", {
            expiresIn: "1h",
        });
    }
}
