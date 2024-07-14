import { Body, Controller, Get, Post } from "@nestjs/common";
import { OrderDTO } from "../../models/order-dto";
import { OrderService } from "../../services/order.service";
import { ApiTags } from "@nestjs/swagger";

@Controller("/order")
@ApiTags("Order")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Get("")
    async getProducts(): Promise<OrderDTO[]> {
        try {
            return await this.orderService.getOrders();
        } catch (error) {
            throw new Error("Error getting products" + error);
        }
    }

    @Post("/create")
    async createOrder(@Body() orderDTO: OrderDTO): Promise<OrderDTO> {
        try {
            return await this.orderService.createOrder(orderDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }
}
