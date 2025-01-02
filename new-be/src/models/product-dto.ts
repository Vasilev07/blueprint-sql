import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";
import { ProductImageDTO } from "./product-image-dto";

export class ProductDTO {
    @AutoMap()
    @ApiPropertyOptional()
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

    @AutoMap(() => [ProductImageDTO])
    @ApiPropertyOptional()
    images?: ProductImageDTO[];
}
