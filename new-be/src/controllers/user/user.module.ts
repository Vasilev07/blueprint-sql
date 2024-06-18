import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entities/user.entity";
import { UserController } from "./user.controller";
import { UserService } from "src/services/user.service";
import { CryptoService } from "src/services/crypto.service";
import { AuthMiddleware } from "src/middlewares/auth.middleware";
import { UserProfile } from "../../mappers/profiles/user.profile";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    exports: [TypeOrmModule],
    controllers: [UserController],
    providers: [
        UserService,
        CryptoService,
        AuthMiddleware,
        UserProfile,
    ],
})
export class UserModule {}
