import { Injectable } from "@nestjs/common";
import { OrderDTO } from "src/models/order-dto";
import { EntityManager } from "typeorm";

@Injectable()
export class OrderService {
    constructor(private entityManager: EntityManager) {}

    async createOrder(orderDTO: OrderDTO) {
        try {
            this.entityManager.save(orderDTO);
        } catch (error) {
            throw new Error("Error creating order");
        }
    }

    async getOrder() {
        // Get order
    }

    async updateOrder() {
        // Update order
    }

    async deleteOrder() {
        // Delete order
    }
}
