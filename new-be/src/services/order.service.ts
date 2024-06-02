import { Injectable } from "@nestjs/common";
import { Order } from "src/entities/order.entity";
import { Product } from "src/entities/product.entity";
import { OrderDTO } from "src/models/order-dto";
import { EntityManager } from "typeorm";

@Injectable()
export class OrderService {
    constructor(private entityManager: EntityManager) {}

    async createOrder(orderDTO: OrderDTO): Promise<OrderDTO> {
        try {
            // TODO REFACTOR WHEN MAPPERS ARE MERGED
            const orderToSave = new Order();

            const products: Product[] = orderDTO.products.map((product) => {
                const currentProduct = new Product();
                currentProduct.id = product.id;
                currentProduct.name = product.name;
                currentProduct.weight = product.weight;
                currentProduct.price = product.price;

                return currentProduct;
            });

            orderToSave.id = orderDTO.id;
            orderToSave.status = orderDTO.status;
            orderToSave.total = orderDTO.total;
            orderToSave.products = products;

            const savedEntity = await this.entityManager.save(orderToSave);

            const dtoToReturn = new OrderDTO();

            dtoToReturn.id = savedEntity.id;
            dtoToReturn.status = savedEntity.status;
            dtoToReturn.total = savedEntity.total;
            dtoToReturn.products = savedEntity.products;

            return dtoToReturn;
        } catch (error) {
            throw new Error("Error creating order" + error);
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
