import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "src/entities/order.entity";
import { OrderController } from "./order.controller";
import { OrderService } from "src/services/order.service";
import { OrderProfile } from "../../mappers/profiles/order/order.profile";

@Module({
    imports: [TypeOrmModule.forFeature([Order])],
    exports: [TypeOrmModule],
    controllers: [OrderController],
    providers: [OrderService, OrderProfile],
})
export class OrderModule {}
