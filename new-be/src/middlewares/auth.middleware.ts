import { Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { verify, sign } from "jsonwebtoken";
import { User } from "src/entities/user.entity";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private configService: ConfigService) {}

    use(req: any, res: any, next: (error?: any) => void) {
        const token = req.headers.authorization?.split(" ")[1] as any;
        const jwtSecret = this.configService.get<string>("JWT_SECRET");
        const decoded = verify(token, jwtSecret);

        if (!decoded) {
            res.status(401).json({ message: "failed" });
        }

        req.userData = decoded;

        next();
    }

    signForUser(user: User) {
        const jwtSecret = this.configService.get<string>("JWT_SECRET");
        const jwtExpiresIn = this.configService.get<string>(
            "JWT_EXPIRES_IN",
            "1h",
        );

        return sign(
            {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                name: `${user.firstname} ${user.lastname}`,
                email: user.email,
                gender: user.gender,
            },
            jwtSecret,
            {
                expiresIn: jwtExpiresIn,
            },
        );
    }
}
