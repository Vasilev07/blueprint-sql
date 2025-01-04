import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProductImageDTO } from "./product-image-d-t.o";

export class ProductDTO {
    @ApiPropertyOptional()
    id?: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    weight: number;

    @ApiProperty()
    price: number;

    @ApiProperty({ type: [ProductImageDTO] })
    images?: ProductImageDTO[] = [];
}
