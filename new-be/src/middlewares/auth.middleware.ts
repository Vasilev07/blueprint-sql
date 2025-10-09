import { Injectable, NestMiddleware } from "@nestjs/common";
import { verify, sign } from "jsonwebtoken";
import { User } from "src/entities/user.entity";

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

    signForUser(user: User) {
        return sign({ 
            id: user.id, 
            firstname: user.firstname, 
            lastname: user.lastname, 
            name: `${user.firstname} ${user.lastname}`, 
            email: user.email,
            gender: user.gender,
            city: user.city
        }, "secred", {
            expiresIn: "1h",
        });
    }
}
