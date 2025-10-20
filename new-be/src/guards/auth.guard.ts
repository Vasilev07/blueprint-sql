import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { verify } from "jsonwebtoken";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private configService: ConfigService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.get<boolean>(
            "isPublic",
            context.getHandler(),
        );

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(" ")[1];

        if (!token) {
            throw new UnauthorizedException("No token provided");
        }

        try {
            const jwtSecret = this.configService.get<string>("JWT_SECRET");
            const decoded = verify(token, jwtSecret);
            request.userData = decoded;
            return true;
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }
}

