import { Injectable } from "@nestjs/common";
import { Order } from "src/entities/order.entity";
import { OrderDTO } from "src/models/order-dto";
import { EntityManager } from "typeorm";
import { Mapper } from "@automapper/core";
import { InjectMapper } from "@automapper/nestjs";

@Injectable()
export class OrderService {
    constructor(
        private entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {}

    async createOrder(orderDTO: OrderDTO): Promise<OrderDTO> {
        try {
            const orderToSave = this.mapper.map(orderDTO, OrderDTO, Order);

            const savedEntity = await this.entityManager.save(orderToSave);

            return this.mapper.map(savedEntity, Order, OrderDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    async getOrders() {
        try {
            const orders: Order[] = await this.entityManager.find(Order);
            return orders.map((order) =>
                this.mapper.map(order, Order, OrderDTO),
            );
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    async updateOrder() {
        // Update order
    }

    async deleteOrder() {
        // Delete order
    }
}
