import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";
import { ProductImageDto } from "./product-image.dto";

export class ProductDto {
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

    @AutoMap(() => [ProductImageDto])
    @ApiProperty({ type: [ProductImageDto] })
    images?: ProductImageDto[];
}
