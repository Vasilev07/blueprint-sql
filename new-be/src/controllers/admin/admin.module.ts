import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Administrator } from "src/entities/administrator.entity";
import { AdminController } from "./admin.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Administrator])],
    exports: [TypeOrmModule],
    controllers: [AdminController],
})
export class AdminModule {}
