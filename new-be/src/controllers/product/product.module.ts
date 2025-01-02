import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "@entities/product.entity";
import { ProductController } from "./product.controller";
import { ProductService } from "@services/product.service";
import { MulterModule } from "@nestjs/platform-express";
import { ProductProfile } from "@mappers/profiles/product.profile";

@Module({
    imports: [
        TypeOrmModule.forFeature([Product]),
        MulterModule.register({ dest: "./uploads" }),
    ],
    exports: [TypeOrmModule],
    controllers: [ProductController],
    providers: [ProductService, ProductProfile],
})
export class ProductModule {}
