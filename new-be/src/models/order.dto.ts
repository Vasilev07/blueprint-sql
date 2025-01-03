import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "src/entities/order.entity";
import { ProductDto } from "./product.dto";
import { AutoMap } from "@automapper/classes";

export class OrderDto {
    @ApiProperty()
    @AutoMap()
    id?: number;

    @ApiProperty()
    @AutoMap()
    status: OrderStatus;

    @ApiProperty()
    @AutoMap()
    total: number;

    @ApiPropertyOptional()
    @AutoMap(() => [ProductDto])
    products?: ProductDto[];

    @ApiProperty()
    @AutoMap()
    created_at: Date;

    @ApiProperty()
    @AutoMap()
    updated_at: Date;
}
