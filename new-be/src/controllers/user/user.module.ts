import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@entities/user.entity";
import { ProfileView } from "@entities/profile-view.entity";
import { UserFriend } from "@entities/friend.entity";
import { UserController } from "./user.controller";
import { UserService } from "@services/user.service";
import { ProfileViewService } from "@services/profile-view.service";
import { CryptoService } from "@services/crypto.service";
import { AuthMiddleware } from "@middlewares/auth.middleware";
import { ChatModule } from "../chat/chat.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, ProfileView, UserFriend]),
        ChatModule,
    ],
    exports: [TypeOrmModule, ProfileViewService],
    controllers: [UserController],
    providers: [UserService, ProfileViewService, CryptoService, AuthMiddleware],
})
export class UserModule {}
