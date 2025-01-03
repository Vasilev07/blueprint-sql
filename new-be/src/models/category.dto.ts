import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";

export class CategoryDTO {
    @ApiPropertyOptional()
    @AutoMap()
    id?: number;

    @ApiProperty()
    @AutoMap()
    name: string;

    @ApiProperty()
    @AutoMap()
    description: string;

    @ApiPropertyOptional()
    @AutoMap(() => CategoryDTO)
    parent?: CategoryDTO;

    @ApiPropertyOptional()
    @AutoMap(() => [CategoryDTO])
    children?: CategoryDTO[];
}
