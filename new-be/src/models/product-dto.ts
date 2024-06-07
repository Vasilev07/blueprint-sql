import { ApiProperty } from "@nestjs/swagger";
import { OrderDTO } from "./order-dto";

export class ProductDTO {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    weight: number;

    @ApiProperty()
    order?: OrderDTO;

    @ApiProperty()
    price: number;
}
