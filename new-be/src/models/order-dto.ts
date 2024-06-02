import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "src/entities/order.entity";
import { ProductDTO } from "./product-dto";

export class OrderDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    status: OrderStatus;

    @ApiProperty()
    total: number;

    @ApiProperty()
    products: ProductDTO[];
}
