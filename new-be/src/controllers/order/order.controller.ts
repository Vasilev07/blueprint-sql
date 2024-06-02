import {Body, Controller, Post} from "@nestjs/common";
import { OrderDTO } from "../../models/order-dto";
import { OrderService } from "../../services/order.service";

@Controller("/order")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post("/create")
    async createOrder(@Body() orderDTO: OrderDTO): Promise<OrderDTO> {
        try {
            return await this.orderService.createOrder(orderDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }
}
