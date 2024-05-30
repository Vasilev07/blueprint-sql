import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "src/entities/order.entity";
import { Product } from "src/entities/product.entity";

export class OrderDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    status: OrderStatus;

    @ApiProperty()
    total: number;

    @ApiProperty()
    products: Product[];
}
