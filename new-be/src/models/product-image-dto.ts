import { AutoMap } from "@automapper/classes";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductImageDTO {
    @AutoMap()
    @ApiPropertyOptional()
    public id?: number;

    @AutoMap()
    @ApiProperty()
    public name: string;

    @AutoMap()
    @ApiProperty()
    public data: string;
}
