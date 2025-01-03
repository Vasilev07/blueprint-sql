import { AutoMap } from "@automapper/classes";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductImageDTO {
    @AutoMap()
    @ApiPropertyOptional()
    id?: number;

    @AutoMap()
    @ApiProperty()
    name: string;

    @AutoMap()
    @ApiProperty()
    data: string;
}
