import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Administrator } from "src/entities/administrator.entity";
import { AdminController } from "./admin.controller";
import { AdministratorService } from "src/services/administrator.service";
import { CryptoService } from "src/services/crypto.service";
import { AuthMiddleware } from "src/middlewares/auth.middleware";

@Module({
    imports: [TypeOrmModule.forFeature([Administrator])],
    exports: [TypeOrmModule],
    controllers: [AdminController],
    providers: [AdministratorService, CryptoService, AuthMiddleware],
})
export class AdminModule {}
