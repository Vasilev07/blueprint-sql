import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductProfile } from "../../mappers/profiles/product.profile";
import { Product } from "../../entities/product.entity";
import { ProductService } from "../../services/product.service";
import { ProductController } from "./product.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    exports: [TypeOrmModule],
    controllers: [ProductController],
    providers: [ProductProfile, ProductService],
})
export class ProductModule {}
