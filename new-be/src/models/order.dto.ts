import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "src/entities/order.entity";
import { ProductDTO } from "./product.dto";
import { AddressDTO } from "./address.dto";

export class OrderDTO {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    status: OrderStatus;

    @ApiProperty()
    total: number;

    @ApiProperty()
    address: AddressDTO;

    @ApiPropertyOptional()
    products?: ProductDTO[];
}
