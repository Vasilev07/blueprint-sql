import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "src/entities/order.entity";
import { ProductDTO } from "./product.dto";

export class OrderDTO {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    status: OrderStatus;

    @ApiProperty()
    total: number;

    @ApiPropertyOptional()
    products?: ProductDTO[];

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}
