import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductImageDTO {
    @ApiPropertyOptional()
    id?: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    data: string;
}
