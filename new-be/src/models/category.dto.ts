import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";

export class CategoryDto {
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
    @AutoMap(() => CategoryDto)
    parent?: CategoryDto;

    @ApiPropertyOptional()
    @AutoMap(() => [CategoryDto])
    children?: CategoryDto[];
}
