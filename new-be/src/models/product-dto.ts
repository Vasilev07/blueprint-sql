import { ApiProperty } from "@nestjs/swagger";
import { OrderDTO } from "./order-dto";
import { AutoMap } from "@automapper/classes";

export class ProductDTO {
    @AutoMap()
    @ApiProperty()
    id?: number;

    @AutoMap()
    @ApiProperty()
    name: string;

    @AutoMap()
    @ApiProperty()
    weight: number;

    @AutoMap(() => OrderDTO)
    @ApiProperty()
    order?: OrderDTO;

    @AutoMap()
    @ApiProperty()
    price: number;
}
