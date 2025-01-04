import { Injectable } from "@nestjs/common";
import { Order } from "src/entities/order.entity";
import { OrderDTO } from "../models/order.dto";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class OrderService {
    private orderRepository: Repository<Order>;
    private mapper: any;

    constructor(entityManager: EntityManager) {
        this.orderRepository = entityManager.getRepository(Order);
        this.mapper = {};
    }

    async createOrder(orderDTO: OrderDTO): Promise<OrderDTO> {
        try {
            const orderToSave = this.mapper.map(orderDTO, OrderDTO, Order);

            const savedEntity = await this.orderRepository.save(orderToSave);

            return this.mapper.map(savedEntity, Order, OrderDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    async getOrders(): Promise<OrderDTO[]> {
        try {
            const orders: Order[] = await this.orderRepository.find();
            return orders.map((order) =>
                this.mapper.map(order, Order, OrderDTO),
            );
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    // TODO think of a more generic way of fetching relations
    async getOrdersWithProducts(): Promise<OrderDTO[]> {
        try {
            const ordersWithProducts = await this.orderRepository.find({
                relations: {
                    products: true,
                },
            });
            console.log(ordersWithProducts, "ordersWithProducts");
            return ordersWithProducts.map((order) =>
                this.mapper.map(order, Order, OrderDTO),
            );
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    async updateOrder(): Promise<void> {
        // Update order
    }

    async deleteOrder(): Promise<void> {
        // Delete order
    }
}
