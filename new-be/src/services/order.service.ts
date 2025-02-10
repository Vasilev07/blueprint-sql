import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Order } from "src/entities/order.entity";
import { OrderDTO } from "../models/order.dto";
import { EntityManager, Repository } from "typeorm";
import { MapperService } from "@mappers/mapper.service";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class OrderService implements OnModuleInit {
    private orderRepository: Repository<Order>;
    private orderMapper: BaseMapper<Order, OrderDTO>;

    constructor(
        private readonly entityManager: EntityManager,
        @Inject(MapperService) private readonly mappersService: MapperService,
    ) {}

    onModuleInit(): any {
        this.orderRepository = this.entityManager.getRepository(Order);
        this.orderMapper = this.mappersService.getMapper("Order");
    }

    async createOrder(orderDTO: OrderDTO): Promise<OrderDTO> {
        try {
            const orderToSave = this.orderMapper.dtoToEntity(orderDTO);

            const savedEntity = await this.orderRepository.save(orderToSave);

            return this.orderMapper.entityToDTO(savedEntity);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    async getOrders(): Promise<OrderDTO[]> {
        try {
            const orders: Order[] = await this.orderRepository.find({
                relations: ["products"],
            });
            console.log(orders, "orders");
            orders.forEach((order, i) => {
                console.log(
                    `Order #${i} has product type:`,
                    Array.isArray(order.products),
                );
            });
            const mapperResult = orders.map((order) =>
                this.orderMapper.entityToDTO(order),
            );
            console.log(mapperResult, "mapperResult".repeat(10));
            return mapperResult;
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
                this.orderMapper.entityToDTO(order),
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
