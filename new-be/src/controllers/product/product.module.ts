import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "@entities/product.entity";
import { ProductController } from "./product.controller";
import { ProductService } from "@services/product.service";

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    exports: [TypeOrmModule],
    controllers: [ProductController],
    providers: [ProductService],
})
export class ProductModule {}
