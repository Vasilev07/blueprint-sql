import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "src/entities/order.entity";
import { OrderController } from "./order.controller";
import { OrderService } from "src/services/order.service";
import { OrderProfile } from "@mappers/profiles/order.profile";
import { ProductProfile } from "@mappers/profiles/product.profile";
import { Product } from "@entities/product.entity";
import { Category } from "@entities/category.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Order, Product, Category])],
    exports: [TypeOrmModule, OrderService],
    controllers: [OrderController],
    providers: [OrderService, OrderProfile, ProductProfile],
})
export class OrderModule {}
