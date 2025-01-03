import { Body, Controller, Get, Post } from "@nestjs/common";
import { OrderDto } from "../../models/order.dto";
import { OrderService } from "@services/order.service";
import { ApiTags } from "@nestjs/swagger";

@Controller("/order")
@ApiTags("Order")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Get("")
    async getProducts(): Promise<OrderDto[]> {
        try {
            return await this.orderService.getOrders();
        } catch (error) {
            throw new Error("Error getting products" + error);
        }
    }

    @Post("/create")
    async createOrder(@Body() orderDTO: OrderDto): Promise<OrderDto> {
        try {
            return await this.orderService.createOrder(orderDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }
}
