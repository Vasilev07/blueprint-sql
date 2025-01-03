import { Injectable } from "@nestjs/common";
import { Order } from "src/entities/order.entity";
import { OrderDto } from "../models/order.dto";
import { EntityManager, Repository } from "typeorm";
import { Mapper } from "@automapper/core";
import { InjectMapper } from "@automapper/nestjs";

@Injectable()
export class OrderService {
    private orderRepository: Repository<Order>;
    constructor(
        entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {
        this.orderRepository = entityManager.getRepository(Order);
    }

    async createOrder(orderDTO: OrderDto): Promise<OrderDto> {
        try {
            const orderToSave = this.mapper.map(orderDTO, OrderDto, Order);

            const savedEntity = await this.orderRepository.save(orderToSave);

            return this.mapper.map(savedEntity, Order, OrderDto);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    async getOrders(): Promise<OrderDto[]> {
        try {
            const orders: Order[] = await this.orderRepository.find();
            return orders.map((order) =>
                this.mapper.map(order, Order, OrderDto),
            );
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    // TODO think of a more generic way of fetching relations
    async getOrdersWithProducts(): Promise<OrderDto[]> {
        try {
            const ordersWithProducts = await this.orderRepository.find({
                relations: {
                    products: true,
                },
            });
            console.log(ordersWithProducts, "ordersWithProducts");
            return ordersWithProducts.map((order) =>
                this.mapper.map(order, Order, OrderDto),
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
