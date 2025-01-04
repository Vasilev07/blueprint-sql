import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";
import { ProductImageDTO } from "./product-image-d-t.o";

export class ProductDTO {
    @AutoMap(() => Number)
    @ApiPropertyOptional()
    id?: number;

    @AutoMap(() => String)
    @ApiProperty()
    name: string;

    @AutoMap(() => Number)
    @ApiProperty()
    weight: number;

    @AutoMap(() => Number)
    @ApiProperty()
    price: number;

    @AutoMap(() => [ProductImageDTO])
    @ApiProperty({ type: [ProductImageDTO] })
    images?: ProductImageDTO[] = [];
}
