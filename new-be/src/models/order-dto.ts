import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "src/entities/order.entity";
import { ProductDTO } from "./product-dto";
import { AutoMap } from "@automapper/classes";

export class OrderDTO {
    @ApiProperty()
    @AutoMap()
    id?: number;

    @ApiProperty()
    @AutoMap()
    status: OrderStatus;

    @ApiProperty()
    @AutoMap()
    total: number;

    @ApiProperty()
    @AutoMap(() => [ProductDTO])
    products: ProductDTO[];

    @ApiProperty()
    @AutoMap()
    created_at: Date;

    @ApiProperty()
    @AutoMap()
    updated_at: Date;
}
