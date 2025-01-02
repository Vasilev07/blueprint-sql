import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";
import { ProductImage } from "@entities/product-image.entity";
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

    @AutoMap()
    @ApiPropertyOptional()
    images: ProductImageDTO[];
}
