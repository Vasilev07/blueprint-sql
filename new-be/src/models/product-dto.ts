import { ApiProperty } from "@nestjs/swagger";
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

    @AutoMap()
    @ApiProperty()
    price: number;

    @AutoMap()
    @ApiProperty()
    category: string;
}
