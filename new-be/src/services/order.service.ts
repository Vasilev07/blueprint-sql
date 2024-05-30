import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";

@Injectable()
export class OrderService {
    constructor(private entityManager: EntityManager) {}

    async createOrder(OrderDTO: OrderDTO) {
        this.entityManager.save();
        // Create order
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
